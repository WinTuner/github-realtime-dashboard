import { ChevronRight, Database, FileCode, GitFork, Search, Star } from 'lucide-react';
import type { Repository } from '@/types/github';
import { useRepoFilter } from '@/hooks/useRepoFilter';
import { getLanguageColor } from '@/lib/constants';
import { formatRepoSizeKB } from '@/lib/format';

interface Props {
  repos: Repository[];
  loading: boolean;
}

export function RepoShowcase({ repos, loading }: Props) {
  const {
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    sortBy,
    setSortBy,
    uniqueLanguages,
    filteredRepos,
  } = useRepoFilter(repos);

  return (
    <div className="glass-panel">
      <div className="repos-panel-header">
        <div className="repos-title-group">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={18} style={{ color: 'var(--accent-cyan)' }} />
            Live Repository Showcase
          </h3>
          <span className="repos-count-badge">{filteredRepos.length} Repos</span>
        </div>

        <div className="repos-controls">
          <div className="search-wrapper">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search repositories..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search repositories"
            />
          </div>

          <select
            className="filter-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            aria-label="Filter by language"
          >
            <option value="All">All Languages</option>
            {uniqueLanguages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort repositories"
          >
            <option value="updated">Recently Updated</option>
            <option value="stars">Most Starred</option>
            <option value="forks">Most Forked</option>
            <option value="name">Alphabetical</option>
            <option value="size">Codebase Size</option>
          </select>
        </div>
      </div>

      {loading && repos.length === 0 ? (
        <div className="repos-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div className="glass-panel repo-card" key={n}>
              <div className="repo-card-top">
                <div className="skeleton" style={{ height: '18px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '36px', width: '90%' }} />
              </div>
              <div className="skeleton" style={{ height: '18px', width: '100%' }} />
            </div>
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No repositories match your criteria.
        </div>
      ) : (
        <div className="repos-grid">
          {filteredRepos.map((repo) => {
            const langColor = getLanguageColor(repo.language);
            return (
              <div className="glass-panel repo-card" key={repo.id}>
                <div className="repo-card-top">
                  <div className="repo-name-row">
                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="repo-name-link">
                      {repo.name}
                      <ChevronRight size={14} />
                    </a>
                    <span className="repo-visibility">{repo.fork ? 'Fork' : 'Source'}</span>
                  </div>
                  <p className="repo-desc">{repo.description || 'No description provided.'}</p>
                </div>

                <div className="repo-card-bottom">
                  <div className="repo-lang-badge">
                    <span className="lang-color-dot" style={{ backgroundColor: langColor }} />
                    <span>{repo.language ?? 'Unknown'}</span>
                  </div>

                  <div className="repo-stats-row">
                    <span className="repo-stat-item" title="Stars">
                      <Star size={12} />
                      {repo.stargazers_count}
                    </span>
                    <span className="repo-stat-item" title="Forks">
                      <GitFork size={12} />
                      {repo.forks_count}
                    </span>
                    <span className="repo-stat-item" title="Size">
                      <Database size={11} />
                      {formatRepoSizeKB(repo.size)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
