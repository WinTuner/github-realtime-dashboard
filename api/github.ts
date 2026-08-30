import type { IncomingMessage, ServerResponse } from 'node:http';

const USERNAME = process.env.GITHUB_USERNAME || 'WinTuner';
const TOKEN = process.env.GITHUB_TOKEN;
const API = 'https://api.github.com';
const GRAPHQL = 'https://api.github.com/graphql';

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  res.end(JSON.stringify(body));
}

function ghHeaders(useAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-realtime-dashboard',
  };
  if (useAuth && TOKEN) headers.Authorization = `Bearer ${TOKEN.trim()}`;
  return headers;
}

async function get(path: string) {
  // Try authenticated first (to get higher rate-limit), fallback to unauthenticated on 401
  // Public endpoints like /users/:login do NOT require auth — a bad TOKEN should not break them.
  let res = await fetch(`${API}${path}`, { headers: ghHeaders(true) });
  if (res.status === 401 && TOKEN) {
    console.warn(`GitHub API ${path} returned 401 with token — retrying unauthenticated`);
    res = await fetch(`${API}${path}`, { headers: ghHeaders(false) });
  }
  if (!res.ok) {
    // Include body excerpt for debugging (e.g. "Bad credentials")
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${path} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function graphql(query: string, variables: Record<string, unknown>) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { ...ghHeaders(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GraphQL failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors).slice(0, 500)}`);
  }
  return data;
}

const PINNED_QUERY = `
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

const CONTRIBUTIONS_QUERY = `
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // Use allSettled so one failed endpoint doesn't take down the whole dashboard
    const [profileRes, reposRes, eventsRes] = await Promise.allSettled([
      get(`/users/${USERNAME}`),
      get(`/users/${USERNAME}/repos?per_page=100&sort=updated`),
      get(`/users/${USERNAME}/events?per_page=30`),
    ]);

    if (profileRes.status === 'rejected' && reposRes.status === 'rejected' && eventsRes.status === 'rejected') {
      // All three failed -> real outage, throw first error
      throw profileRes.reason ?? reposRes.reason ?? eventsRes.reason;
    }

    const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
    const repos = reposRes.status === 'fulfilled' ? reposRes.value : [];
    const events = eventsRes.status === 'fulfilled' ? eventsRes.value : [];

    const warnings: string[] = [];
    if (profileRes.status === 'rejected') warnings.push(`profile: ${String(profileRes.reason)}`);
    if (reposRes.status === 'rejected') warnings.push(`repos: ${String(reposRes.reason)}`);
    if (eventsRes.status === 'rejected') warnings.push(`events: ${String(eventsRes.reason)}`);

    let pinned: unknown = [];
    let contributions: unknown = null;

    if (TOKEN) {
      try {
        const [pinnedRes, contribRes] = await Promise.all([
          graphql(PINNED_QUERY, { login: USERNAME }),
          graphql(CONTRIBUTIONS_QUERY, { login: USERNAME }),
        ]);
        pinned =
          pinnedRes?.data?.user?.pinnedItems?.nodes?.map(
            (n: { id: string; name: string; description: string | null; url: string; stargazerCount: number; forkCount: number; primaryLanguage: { name: string; color: string | null } | null }) => ({
              id: n.id,
              name: n.name,
              description: n.description,
              url: n.url,
              stargazers_count: n.stargazerCount,
              forks_count: n.forkCount,
              language: n.primaryLanguage?.name || null,
              language_color: n.primaryLanguage?.color || null,
            }),
          ) ?? [];
        contributions =
          contribRes?.data?.user?.contributionsCollection?.contributionCalendar ?? null;
      } catch (e) {
        // GraphQL failure (e.g. bad token) should not break the whole dashboard
        warnings.push(`graphql: ${e instanceof Error ? e.message : String(e)}`);
        console.warn('GraphQL failed, returning empty pinned/contributions:', e);
      }
    }

    json(res, 200, {
      profile,
      repos,
      events,
      pinned,
      contributions,
      authenticated: Boolean(TOKEN),
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Hint for 401 specifically
    const hint =
      message.includes('401')
        ? ' — Check Vercel env GITHUB_TOKEN: it is invalid/expired/revoked. Remove it or set a valid fine-grained PAT (no scopes needed for public data).'
        : '';
    json(res, 502, { error: message + hint });
  }
}