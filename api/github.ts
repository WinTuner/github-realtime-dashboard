import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  CONTRIBUTIONS_QUERY,
  PINNED_QUERY,
  get,
  getToken,
  getUsername,
  graphql,
  mapContributions,
  mapPinned,
  type ContributionsDto,
  type PinnedRepoDto,
  type RestMeta,
} from './_lib/github.js';

function json(res: ServerResponse, status: number, body: unknown, cacheSeconds = 60) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${cacheSeconds}, stale-while-revalidate=300`,
  );
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== undefined && req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' }, 0);
    return;
  }

  const username = getUsername();
  const token = getToken();
  const warnings: string[] = [];

  try {
    const [profileRes, eventsRes, firstRepos] = await Promise.all([
      get(`/users/${username}`),
      get(`/users/${username}/events?per_page=30`),
      get<unknown[]>(`/users/${username}/repos?per_page=100&page=1&sort=updated`),
    ]);

    // Paginate repos (up to 3 pages / 300 repos) so large profiles aren't truncated at 100.
    const allRepos = [...firstRepos.data];
    if (firstRepos.data.length === 100) {
      for (let page = 2; page <= 3; page++) {
        try {
          const next = await get<unknown[]>(
            `/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
          );
          allRepos.push(...next.data);
          if (next.data.length < 100) break;
        } catch (err) {
          warnings.push(
            err instanceof Error ? `repos page ${page}: ${err.message}` : `repos page ${page} failed`,
          );
          break;
        }
      }
    }

    const rateLimit: RestMeta | null =
      profileRes.rateLimit ?? firstRepos.rateLimit ?? eventsRes.rateLimit ?? null;

    let pinned: PinnedRepoDto[] = [];
    let contributions: ContributionsDto | null = null;

    if (token) {
      const [pinnedSettled, contribSettled] = await Promise.allSettled([
        graphql(PINNED_QUERY, { login: username }),
        graphql(CONTRIBUTIONS_QUERY, { login: username }),
      ]);

      if (pinnedSettled.status === 'fulfilled') {
        pinned = mapPinned(pinnedSettled.value);
      } else {
        warnings.push(
          pinnedSettled.reason instanceof Error
            ? `pinned: ${pinnedSettled.reason.message}`
            : 'pinned: unknown error',
        );
      }

      if (contribSettled.status === 'fulfilled') {
        contributions = mapContributions(contribSettled.value);
      } else {
        warnings.push(
          contribSettled.reason instanceof Error
            ? `contributions: ${contribSettled.reason.message}`
            : 'contributions: unknown error',
        );
      }
    }

    json(res, 200, {
      profile: profileRes.data,
      repos: allRepos,
      events: eventsRes.data,
      pinned,
      contributions,
      authenticated: Boolean(token),
      rateLimit,
      ...(warnings.length ? { warnings } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    json(res, 502, { error: message }, 0);
  }
}
