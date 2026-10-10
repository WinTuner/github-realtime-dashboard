import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  CONTRIBUTIONS_QUERY,
  PINNED_QUERY,
  buildPinnedFallback,
  friendlyWarning,
  get,
  getToken,
  getUsername,
  graphql,
  isAuthError,
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
    // allSettled: one failed endpoint degrades gracefully instead of 502ing the dashboard.
    const [profileSettled, eventsSettled, firstReposSettled] = await Promise.allSettled([
      get(`/users/${username}`),
      get(`/users/${username}/events?per_page=30`),
      get<unknown[]>(`/users/${username}/repos?per_page=100&page=1&sort=updated`),
    ]);

    if (
      profileSettled.status === 'rejected' &&
      eventsSettled.status === 'rejected' &&
      firstReposSettled.status === 'rejected'
    ) {
      throw (
        profileSettled.reason ?? eventsSettled.reason ?? firstReposSettled.reason
      );
    }

    if (profileSettled.status === 'rejected') {
      warnings.push(`profile: ${String(profileSettled.reason)}`);
    }
    if (eventsSettled.status === 'rejected') {
      warnings.push(`events: ${String(eventsSettled.reason)}`);
    }

    const profile = profileSettled.status === 'fulfilled' ? profileSettled.value.data : null;
    const events = eventsSettled.status === 'fulfilled' ? eventsSettled.value.data : [];
    const firstRepos =
      firstReposSettled.status === 'fulfilled' ? firstReposSettled.value.data : null;
    if (firstReposSettled.status === 'rejected') {
      warnings.push(`repos: ${String(firstReposSettled.reason)}`);
    }

    // Paginate repos (up to 3 pages / 300 repos) so large profiles aren't truncated at 100.
    const allRepos: unknown[] = firstRepos ? [...firstRepos] : [];
    if (firstRepos && firstRepos.length === 100) {
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
      (profileSettled.status === 'fulfilled' ? profileSettled.value.rateLimit : null) ??
      (firstReposSettled.status === 'fulfilled' ? firstReposSettled.value.rateLimit : null) ??
      (eventsSettled.status === 'fulfilled' ? eventsSettled.value.rateLimit : null) ??
      null;

    let pinned: PinnedRepoDto[] = [];
    let contributions: ContributionsDto | null = null;
    let tokenRejected = false;

    if (token) {
      const [pinnedSettled, contribSettled] = await Promise.allSettled([
        graphql(PINNED_QUERY, { login: username }),
        graphql(CONTRIBUTIONS_QUERY, { login: username }),
      ]);

      if (pinnedSettled.status === 'fulfilled') {
        pinned = mapPinned(pinnedSettled.value);
      } else if (isAuthError(pinnedSettled.reason) && allRepos.length > 0) {
        // Bad token must not blank the panel: degrade to top-starred REST repos.
        pinned = buildPinnedFallback(allRepos);
        tokenRejected = true;
        warnings.push(
          'pinned: GitHub token rejected (401) — showing top-starred repos instead; check the GITHUB_TOKEN env var',
        );
      } else {
        warnings.push(friendlyWarning('pinned', pinnedSettled.reason));
        tokenRejected ||= isAuthError(pinnedSettled.reason);
      }

      if (contribSettled.status === 'fulfilled') {
        contributions = mapContributions(contribSettled.value);
      } else {
        warnings.push(friendlyWarning('contributions', contribSettled.reason));
        tokenRejected ||= isAuthError(contribSettled.reason);
      }
    }

    json(res, 200, {
      profile,
      repos: allRepos,
      events,
      pinned,
      contributions,
      authenticated: Boolean(token) && !tokenRejected,
      rateLimit,
      ...(warnings.length ? { warnings } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const hint = message.includes('401')
      ? ' — Check Vercel env GITHUB_TOKEN: it may be invalid/expired/revoked. Remove it or set a valid fine-grained PAT (no scopes needed for public data).'
      : '';
    json(res, 502, { error: message + hint }, 0);
  }
}
