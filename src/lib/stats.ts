import type { GitHubEvent, Repository } from '@/types/github';
import { formatSizeKB, getContributionColor } from '@/lib/format';
import { getLanguageColor } from '@/lib/constants';

export interface RepoStats {
  totalStars: number;
  totalForks: number;
  formattedSize: string;
  activeReposCount: number;
}

export function computeStats(repos: Repository[], nowMs = Date.now()): RepoStats {
  let stars = 0;
  let forks = 0;
  let totalSizeKB = 0;
  let activeReposCount = 0;
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  for (const repo of repos) {
    stars += repo.stargazers_count;
    forks += repo.forks_count;
    totalSizeKB += repo.size;

    const updateMs = new Date(repo.updated_at).getTime();
    if (!Number.isNaN(updateMs) && updateMs >= thirtyDaysAgoMs) {
      activeReposCount++;
    }
  }

  return {
    totalStars: stars,
    totalForks: forks,
    formattedSize: formatSizeKB(totalSizeKB),
    activeReposCount,
  };
}

export interface LanguageSummary {
  name: string;
  size: number;
  pct: number;
  color: string;
}

export function computeLanguages(repos: Repository[]): LanguageSummary[] {
  const langSizes: Record<string, number> = {};
  let totalSize = 0;

  for (const repo of repos) {
    if (repo.language && !repo.fork) {
      langSizes[repo.language] = (langSizes[repo.language] || 0) + repo.size;
      totalSize += repo.size;
    }
  }

  if (totalSize === 0) return [];

  return Object.entries(langSizes)
    .map(([name, size]) => ({
      name,
      size,
      pct: (size / totalSize) * 100,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.size - a.size);
}

export function getUniqueLanguages(repos: Repository[]): string[] {
  const set = new Set<string>();
  for (const repo of repos) {
    if (repo.language) set.add(repo.language);
  }
  return Array.from(set).sort();
}

export type RepoSortKey = 'updated' | 'stars' | 'forks' | 'name' | 'size';

export function filterAndSortRepos(
  repos: Repository[],
  searchQuery: string,
  selectedLanguage: string,
  sortBy: string,
): Repository[] {
  const q = searchQuery.trim().toLowerCase();
  return repos
    .filter((repo) => {
      const matchesSearch =
        q === '' ||
        repo.name.toLowerCase().includes(q) ||
        (repo.description?.toLowerCase().includes(q) ?? false);
      const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;
      return matchesSearch && matchesLang;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
      if (sortBy === 'forks') return b.forks_count - a.forks_count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}

export interface Habits {
  hourHabit: string;
  activeDay: string;
  commitCount: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function computeHabits(events: GitHubEvent[]): Habits {
  if (events.length === 0) return { hourHabit: 'N/A', activeDay: 'N/A', commitCount: 0 };

  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};
  let commitCount = 0;

  let maxHour = -1;
  let maxHourCount = 0;
  let maxDay = -1;
  let maxDayCount = 0;

  for (const e of events) {
    const d = new Date(e.created_at);
    if (Number.isNaN(d.getTime())) continue;

    const hour = d.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    if (hourCounts[hour] > maxHourCount) {
      maxHourCount = hourCounts[hour];
      maxHour = hour;
    }

    const day = d.getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    if (dayCounts[day] > maxDayCount) {
      maxDayCount = dayCounts[day];
      maxDay = day;
    }

    if (e.type === 'PushEvent') {
      const c = e.payload.commits;
      commitCount += c && c.length > 0 ? c.length : (e.payload.size ?? e.payload.distinct_size ?? 0);
    }
  }

  let hourHabit = 'N/A';
  if (maxHour !== -1) {
    if (maxHour >= 5 && maxHour < 9) hourHabit = 'Early Bird (5am-9am)';
    else if (maxHour >= 9 && maxHour < 17) hourHabit = 'Productive Business (9am-5pm)';
    else if (maxHour >= 17 && maxHour < 22) hourHabit = 'Evening Enthusiast (5pm-10pm)';
    else hourHabit = 'Night Owl (10pm-5am)';
  }

  return {
    hourHabit,
    activeDay: maxDay !== -1 ? DAY_NAMES[maxDay] : 'N/A',
    commitCount,
  };
}

export interface ActivitySlot {
  hour: number;
  label: string;
  count: number;
}

/** Single-pass bucketing: O(n) instead of O(24*n). */
export function bucketActivity24h(events: GitHubEvent[], nowMs = Date.now()): ActivitySlot[] {
  const counts = new Array<number>(24).fill(0);
  for (const e of events) {
    const t = new Date(e.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const diffHours = (nowMs - t) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours < 24) {
      const idx = 23 - Math.floor(diffHours);
      counts[idx]++;
    }
  }

  const slots: ActivitySlot[] = [];
  for (let i = 23; i >= 0; i--) {
    const slotTime = new Date(nowMs - i * 60 * 60 * 1000);
    const hour = slotTime.getHours();
    slots.push({ hour, label: `${hour}:00`, count: counts[23 - i] });
  }
  return slots;
}

export { getContributionColor };
