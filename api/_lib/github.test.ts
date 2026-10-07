import { describe, expect, it } from 'vitest';
import { mapContributions, mapPinned } from './github.js';

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
