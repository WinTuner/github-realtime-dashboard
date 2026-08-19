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

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-realtime-dashboard',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function get(path: string) {
  const res = await fetch(`${API}${path}`, { headers: ghHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function graphql(query: string, variables: Record<string, unknown>) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL failed: ${res.status}`);
  return res.json();
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
              level
            }
          }
        }
      }
    }
  }
`;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const [profile, repos, events] = await Promise.all([
      get(`/users/${USERNAME}`),
      get(`/users/${USERNAME}/repos?per_page=100&sort=updated`),
      get(`/users/${USERNAME}/events?per_page=30`),
    ]);

    let pinned: unknown = [];
    let contributions: unknown = null;

    if (TOKEN) {
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
    }

    json(res, 200, {
      profile,
      repos,
      events,
      pinned,
      contributions,
      authenticated: Boolean(TOKEN),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    json(res, 502, { error: message });
  }
}