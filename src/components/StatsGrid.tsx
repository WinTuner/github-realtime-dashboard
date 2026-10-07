import { Activity, BookOpen, Database, GitFork, Star, Users } from 'lucide-react';
import type { Profile } from '@/types/github';
import type { RepoStats } from '@/lib/stats';

interface Props {
  profile: Profile | null;
  stats: RepoStats;
  loading: boolean;
}

export function StatsGrid({ profile, stats, loading }: Props) {
  const value = (v: string | number) => (loading ? '...' : v);
  return (
    <section className="stats-grid" aria-label="Repository statistics">
      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Repositories</span>
          <BookOpen size={16} />
        </div>
        <div className="stat-value">{value(profile?.public_repos || 0)}</div>
        <div className="stat-trend">Total public repos</div>
      </div>

      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Total Stars</span>
          <Star size={16} />
        </div>
        <div className="stat-value">{value(stats.totalStars)}</div>
        <div className="stat-trend">Aggregated stars</div>
      </div>

      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Forks</span>
          <GitFork size={16} />
        </div>
        <div className="stat-value">{value(stats.totalForks)}</div>
        <div className="stat-trend">Forked by others</div>
      </div>

      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Followers</span>
          <Users size={16} />
        </div>
        <div className="stat-value">{value(profile?.followers || 0)}</div>
        <div className="stat-trend">Current followers</div>
      </div>

      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Active Repos</span>
          <Activity size={16} />
        </div>
        <div className="stat-value">{value(stats.activeReposCount)}</div>
        <div className="stat-trend">Updated in last 30d</div>
      </div>

      <div className="glass-panel stats-card">
        <div className="stat-header">
          <span>Storage Size</span>
          <Database size={16} />
        </div>
        <div className="stat-value">{value(stats.formattedSize)}</div>
        <div className="stat-trend">Active codebase size</div>
      </div>
    </section>
  );
}
