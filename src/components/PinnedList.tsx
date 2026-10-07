import { GitFork, Pin, Star } from 'lucide-react';
import type { PinnedRepo } from '@/types/github';
import { getLanguageColor } from '@/lib/constants';

interface Props {
  pinned: PinnedRepo[];
  loading: boolean;
}

export function PinnedList({ pinned, loading }: Props) {
  return (
    <div className="glass-panel">
      <div className="panel-title">
        Pinned Repositories
        <Pin size={16} />
      </div>
      <div className="panel-body pinned-list">
        {loading && pinned.length === 0 ? (
          [1, 2, 3].map((n) => (
            <div className="skeleton" key={n} style={{ height: '74px', borderRadius: '10px' }} />
          ))
        ) : pinned.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            No pinned repositories found.
          </div>
        ) : (
          pinned.map((repo) => {
            const langColor = repo.language_color || getLanguageColor(repo.language);
            return (
              <a key={repo.id} href={repo.url} target="_blank" rel="noreferrer" className="pinned-item">
                <div className="pinned-item-top">
                  <span className="pinned-item-name">{repo.name}</span>
                  {repo.language && (
                    <span className="repo-lang-badge">
                      <span className="lang-color-dot" style={{ backgroundColor: langColor }} />
                      <span>{repo.language}</span>
                    </span>
                  )}
                </div>
                <p className="pinned-item-desc">{repo.description || 'No description provided.'}</p>
                <div className="repo-stats-row">
                  <span className="repo-stat-item" title="Stars">
                    <Star size={12} />
                    {repo.stargazers_count}
                  </span>
                  <span className="repo-stat-item" title="Forks">
                    <GitFork size={12} />
                    {repo.forks_count}
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
