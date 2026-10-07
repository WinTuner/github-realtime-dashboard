import { describe, expect, it } from 'vitest';
import { friendlyWarning, isAuthError, mapContributions, mapPinned } from './github.js';

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
    expect(friendlyWarning('pinned', new Error('GraphQL failed: 401'))).toBe(
      'pinned: GitHub token rejected (401) — check the GITHUB_TOKEN env var',
    );
  });

  it('passes through other errors', () => {
    expect(friendlyWarning('repos', new Error('boom'))).toBe('repos: boom');
  });
});
