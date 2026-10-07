import { describe, expect, it } from 'vitest';
import type { GitHubEvent, Repository } from '@/types/github';
import {
  bucketActivity24h,
  computeHabits,
  computeLanguages,
  computeStats,
  filterAndSortRepos,
  getUniqueLanguages,
} from '@/lib/stats';

function repo(partial: Partial<Repository> & { id: number; name: string }): Repository {
  return {
    description: null,
    html_url: `https://github.com/x/${partial.name}`,
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    size: 100,
    updated_at: new Date().toISOString(),
    topics: [],
    fork: false,
    ...partial,
  };
}

function event(partial: Partial<GitHubEvent> & { id: string }): GitHubEvent {
  return {
    type: 'PushEvent',
    actor: { login: 'WinTuner' },
    repo: { id: 1, name: 'WinTuner/app', url: '' },
    payload: {},
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe('computeStats', () => {
  it('sums stars/forks/size and counts 30d activity without mutating input', () => {
    const now = new Date('2026-06-01T00:00:00Z').getTime();
    const repos = [
      repo({ id: 1, name: 'a', stargazers_count: 5, forks_count: 2, size: 1024, updated_at: '2026-05-20T00:00:00Z' }),
      repo({ id: 2, name: 'b', stargazers_count: 3, forks_count: 1, size: 1024, updated_at: '2026-01-01T00:00:00Z' }),
    ];
    const stats = computeStats(repos, now);
    expect(stats.totalStars).toBe(8);
    expect(stats.totalForks).toBe(3);
    expect(stats.activeReposCount).toBe(1);
    expect(stats.formattedSize).toBe('2.0 MB');
  });
});

describe('computeLanguages', () => {
  it('excludes forks and weights by size', () => {
    const repos = [
      repo({ id: 1, name: 'a', language: 'TypeScript', size: 300 }),
      repo({ id: 2, name: 'b', language: 'Python', size: 100 }),
      repo({ id: 3, name: 'c', language: 'Python', size: 50, fork: true }),
    ];
    const langs = computeLanguages(repos);
    expect(langs.map((l) => l.name)).toEqual(['TypeScript', 'Python']);
    expect(langs[0].pct).toBeCloseTo(75);
  });

  it('returns empty for no data', () => {
    expect(computeLanguages([])).toEqual([]);
  });
});

describe('getUniqueLanguages', () => {
  it('dedupes and sorts', () => {
    const repos = [
      repo({ id: 1, name: 'a', language: 'Python' }),
      repo({ id: 2, name: 'b', language: 'Go' }),
      repo({ id: 3, name: 'c', language: 'Python' }),
    ];
    expect(getUniqueLanguages(repos)).toEqual(['Go', 'Python']);
  });
});

describe('filterAndSortRepos', () => {
  it('filters by query and language, sorts by stars', () => {
    const repos = [
      repo({ id: 1, name: 'alpha', description: 'cool tool', language: 'Go', stargazers_count: 1 }),
      repo({ id: 2, name: 'beta', description: 'another', language: 'Go', stargazers_count: 9 }),
      repo({ id: 3, name: 'gamma', description: 'cool lib', language: 'Rust', stargazers_count: 5 }),
    ];
    const out = filterAndSortRepos(repos, 'cool', 'All', 'stars');
    expect(out.map((r) => r.name)).toEqual(['gamma', 'alpha']);
  });
});

describe('computeHabits', () => {
  it('handles empty events', () => {
    expect(computeHabits([])).toEqual({ hourHabit: 'N/A', activeDay: 'N/A', commitCount: 0 });
  });

  it('counts commits and picks peak windows', () => {
    const at = '2026-06-02T10:00:00Z';
    const events = [
      event({ id: '1', created_at: at, payload: { commits: [{ sha: 'a', message: 'x', author: { name: 'n', email: 'e' } }] } }),
      event({ id: '2', created_at: at, payload: { commits: [{ sha: 'b', message: 'y', author: { name: 'n', email: 'e' } }, { sha: 'c', message: 'z', author: { name: 'n', email: 'e' } }] } }),
    ];
    const habits = computeHabits(events);
    const expectedDay = new Date(at).toLocaleString('en-US', { weekday: 'long' });
    expect(habits.commitCount).toBe(3);
    expect(habits.activeDay).toBe(expectedDay);
    expect([
      'Early Bird (5am-9am)',
      'Productive Business (9am-5pm)',
      'Evening Enthusiast (5pm-10pm)',
      'Night Owl (10pm-5am)',
    ]).toContain(habits.hourHabit);
  });

  it('falls back to payload size when commits are truncated', () => {
    const events = [
      event({ id: '1', created_at: '2026-06-02T10:00:00Z', payload: { commits: [], size: 7 } }),
      event({ id: '2', created_at: '2026-06-02T10:00:00Z', payload: { size: 3 } }),
    ];
    expect(computeHabits(events).commitCount).toBe(10);
  });
});

describe('bucketActivity24h', () => {
  it('buckets in a single pass and ignores old events', () => {
    const now = new Date('2026-06-01T12:00:00Z').getTime();
    const events = [
      event({ id: '1', created_at: '2026-06-01T11:10:00Z' }),
      event({ id: '2', created_at: '2026-06-01T11:40:00Z' }),
      event({ id: '3', created_at: '2026-05-20T00:00:00Z' }),
    ];
    const slots = bucketActivity24h(events, now);
    expect(slots).toHaveLength(24);
    expect(slots.reduce((n, s) => n + s.count, 0)).toBe(2);
    expect(slots[23].count).toBe(2);
  });
});
