import { describe, expect, it } from 'vitest';
import {
  buildPinnedFallback,
  friendlyWarning,
  getToken,
  isAuthError,
  mapContributions,
  mapPinned,
} from './github.js';

describe('mapPinned', () => {
  it('maps GraphQL nodes to DTOs', () => {
    const out = mapPinned({
      user: {
        pinnedItems: {
          nodes: [
            {
              id: '1',
              name: 'app',
              description: 'demo',
              url: 'https://github.com/x/app',
              stargazerCount: 10,
              forkCount: 2,
              primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
            },
          ],
        },
      },
    });
    expect(out).toEqual([
      {
        id: '1',
        name: 'app',
        description: 'demo',
        url: 'https://github.com/x/app',
        stargazers_count: 10,
        forks_count: 2,
        language: 'TypeScript',
        language_color: '#3178c6',
      },
    ]);
  });

  it('returns empty array for malformed payloads', () => {
    expect(mapPinned({})).toEqual([]);
    expect(mapPinned(null)).toEqual([]);
  });
});

describe('mapContributions', () => {
  it('extracts the calendar', () => {
    const calendar = {
      totalContributions: 42,
      weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 3 }] }],
    };
    expect(
      mapContributions({ user: { contributionsCollection: { contributionCalendar: calendar } } }),
    ).toEqual(calendar);
  });

  it('returns null for malformed payloads', () => {
    expect(mapContributions({})).toBeNull();
  });
});

describe('isAuthError', () => {
  it('detects 401s and bad credentials', () => {
    expect(isAuthError(new Error('GraphQL failed: 401 { "message": "Bad credentials" }'))).toBe(true);
    expect(isAuthError('request failed: 403 rate limited')).toBe(false);
  });
});

describe('friendlyWarning', () => {
  it('sanitizes auth failures', () => {
    const msg = friendlyWarning('pinned', new Error('GraphQL failed: 401'));
    expect(msg).toMatch(/^pinned: GitHub token rejected \(401\)/);
    expect(msg).toContain('GITHUB_TOKEN');
  });

  it('passes through other errors', () => {
    expect(friendlyWarning('repos', new Error('boom'))).toBe('repos: boom');
  });
});

describe('getToken', () => {
  it('strips whitespace and surrounding quotes', () => {
    const prev = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = '  "ghp_test123"  ';
    expect(getToken()).toBe('ghp_test123');
    process.env.GITHUB_TOKEN = '   ';
    expect(getToken()).toBeUndefined();
    if (prev === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev;
  });
});

describe('buildPinnedFallback', () => {
  it('maps REST repos to pinned shape, top-starred first', () => {
    const out = buildPinnedFallback([
      {
        id: 1,
        name: 'low',
        description: null,
        html_url: 'https://github.com/x/low',
        stargazers_count: 2,
        forks_count: 0,
        language: 'Go',
      },
      {
        id: 2,
        name: 'high',
        description: 'top',
        html_url: 'https://github.com/x/high',
        stargazers_count: 99,
        forks_count: 5,
        language: null,
      },
    ]);
    expect(out.map((r) => r.name)).toEqual(['high', 'low']);
    expect(out[0].language_color).toBeNull();
  });

  it('returns empty for non-arrays', () => {
    expect(buildPinnedFallback(null)).toEqual([]);
  });
});
