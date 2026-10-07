import { z } from 'zod';

export const API = 'https://api.github.com';
export const GRAPHQL = 'https://api.github.com/graphql';
export const REQUEST_TIMEOUT_MS = 8000;

export function getUsername(): string {
  return process.env.GITHUB_USERNAME || 'WinTuner';
}

export function getToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

export function ghHeaders(useAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-realtime-dashboard',
  };
  const token = getToken()?.trim();
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export interface RestMeta {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}

export function parseRateLimit(headers: Headers): RestMeta {
  const num = (v: string | null) => (v == null || v === '' ? null : Number(v));
  return {
    limit: num(headers.get('x-ratelimit-limit')),
    remaining: num(headers.get('x-ratelimit-remaining')),
    reset: num(headers.get('x-ratelimit-reset')),
  };
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readBodyExcerpt(res: Response, max = 200): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, max);
  } catch {
    return '';
  }
}

export async function get<T = unknown>(
  path: string,
): Promise<{ data: T; rateLimit: RestMeta | null }> {
  let res: Response;
  try {
    // Authenticated first (higher rate-limit); a bad token must not break public endpoints.
    res = await fetchWithTimeout(`${API}${path}`, { headers: ghHeaders(true) });
    if (res.status === 401 && getToken()) {
      res = await fetchWithTimeout(`${API}${path}`, { headers: ghHeaders(false) });
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`GitHub API ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  }
  const rateLimit = parseRateLimit(res.headers);
  if (!res.ok) {
    const excerpt = await readBodyExcerpt(res);
    throw new Error(`GitHub API ${path} failed: ${res.status}${excerpt ? ` ${excerpt}` : ''}`);
  }
  const data = (await res.json()) as T;
  return { data, rateLimit };
}

export async function graphql<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      GRAPHQL,
      {
        method: 'POST',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      },
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`GraphQL timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  }
  if (!res.ok) {
    const excerpt = await readBodyExcerpt(res);
    throw new Error(`GraphQL failed: ${res.status}${excerpt ? ` ${excerpt}` : ''}`);
  }
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) {
    throw new Error(`GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  return (body.data ?? {}) as T;
}

export const PINNED_QUERY = `
  query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            id
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage { name color }
          }
        }
      }
    }
  }
`;

export const CONTRIBUTIONS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

// --- Zod schemas for GraphQL shape validation (defensive against API drift) ---

const PinnedNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  stargazerCount: z.number(),
  forkCount: z.number(),
  primaryLanguage: z.object({ name: z.string(), color: z.string().nullable() }).nullable(),
});

const PinnedResponseSchema = z.object({
  user: z
    .object({
      pinnedItems: z.object({ nodes: z.array(PinnedNodeSchema) }).nullable().optional(),
    })
    .nullable(),
});

const ContributionsResponseSchema = z.object({
  user: z
    .object({
      contributionsCollection: z
        .object({
          contributionCalendar: z
            .object({
              totalContributions: z.number(),
              weeks: z.array(
                z.object({
                  contributionDays: z.array(
                    z.object({ date: z.string(), contributionCount: z.number() }),
                  ),
                }),
              ),
            })
            .nullable(),
        })
        .nullable()
        .optional(),
    })
    .nullable(),
});

export interface PinnedRepoDto {
  id: string;
  name: string;
  description: string | null;
  url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  language_color: string | null;
}

export interface ContributionsDto {
  totalContributions: number;
  weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
}

export function mapPinned(data: unknown): PinnedRepoDto[] {
  const parsed = PinnedResponseSchema.safeParse(data);
  if (!parsed.success) return [];
  const nodes = parsed.data.user?.pinnedItems?.nodes ?? [];
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    description: n.description,
    url: n.url,
    stargazers_count: n.stargazerCount,
    forks_count: n.forkCount,
    language: n.primaryLanguage?.name ?? null,
    language_color: n.primaryLanguage?.color ?? null,
  }));
}

export function mapContributions(data: unknown): ContributionsDto | null {
  const parsed = ContributionsResponseSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data.user?.contributionsCollection?.contributionCalendar ?? null;
}
