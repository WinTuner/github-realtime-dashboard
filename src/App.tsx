import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Users, 
  BookOpen, 
  Star, 
  GitFork, 
  RefreshCw, 
  Search, 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Code2, 
  Activity, 
  FileCode,
  ExternalLink,
  ChevronRight,
  Database,
  Pin
} from 'lucide-react';

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'text-bottom' }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
import './App.css';

// GitHub event types interface
interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    login: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    commits?: Array<{
      sha: string;
      message: string;
      author: {
        name: string;
        email: string;
      };
    }>;
    pull_request?: {
      number: number;
      title: string;
    };
    issue?: {
      number: number;
      title: string;
    };
    forkee?: {
      full_name: string;
    };
  };
  created_at: string;
}

// GitHub Repo interface
interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  updated_at: string;
  topics: string[];
  fork: boolean;
}

// GitHub Profile interface
interface Profile {
  avatar_url: string;
  name: string;
  login: string;
  bio: string;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  blog: string | null;
}

// Pinned repository (from GraphQL)
interface PinnedRepo {
  id: string;
  name: string;
  description: string | null;
  url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  language_color: string | null;
}

// Contribution calendar (from GraphQL)
interface ContributionDay {
  date: string;
  contributionCount: number;
}
interface ContributionWeek {
  contributionDays: ContributionDay[];
}
interface Contributions {
  totalContributions: number;
  weeks: ContributionWeek[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Rust: "#dea584",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Shell: "#89e051",
  Docker: "#384d54",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Scala: "#c22d40",
  Makefile: "#427819",
  CMake: "#DA3434",
  Vue: "#41b883",
  React: "#61dafb"
};

const DEFAULT_USERNAME = 'WinTuner';

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [pinned, setPinned] = useState<PinnedRepo[]>([]);
  const [contributions, setContributions] = useState<Contributions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // Auto polling (countdown timer in seconds)
  const [countdown, setCountdown] = useState<number>(60);
  const countdownIntervalRef = useRef<any>(null);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('updated');

  // Trigger data load
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const res = await fetch('/api/github');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to load dashboard (${res.status})`);
      }
      const data = await res.json();

      setProfile(data.profile ?? null);
      setRepos(data.repos ?? []);
      setEvents(data.events ?? []);
      setPinned(data.pinned ?? []);
      setContributions(data.contributions ?? null);
      setAuthenticated(data.authenticated ?? false);

      setCountdown(60); // Reset timer on successful refresh
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching live data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run on mount
  useEffect(() => {
    loadData();
  }, []);

  // Set up polling countdown
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // KPIs Calculations
  const stats = useMemo(() => {
    let stars = 0;
    let forks = 0;
    let totalSizeKB = 0;
    let activeReposCount = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    repos.forEach((repo) => {
      stars += repo.stargazers_count;
      forks += repo.forks_count;
      totalSizeKB += repo.size;
      
      const updateDate = new Date(repo.updated_at);
      if (updateDate >= thirtyDaysAgo) {
        activeReposCount++;
      }
    });

    const formattedSize = totalSizeKB > 1024 * 1024
      ? `${(totalSizeKB / (1024 * 1024)).toFixed(2)} GB`
      : `${(totalSizeKB / 1024).toFixed(1)} MB`;

    return {
      totalStars: stars,
      totalForks: forks,
      formattedSize,
      activeReposCount
    };
  }, [repos]);

  // Languages aggregation weighted by repo size (similar to GitHub calculation)
  const languagesSummary = useMemo(() => {
    const langSizes: Record<string, number> = {};
    let totalSize = 0;

    repos.forEach((repo) => {
      if (repo.language && !repo.fork) {
        langSizes[repo.language] = (langSizes[repo.language] || 0) + repo.size;
        totalSize += repo.size;
      }
    });

    if (totalSize === 0) return [];

    const list = Object.entries(langSizes)
      .map(([name, size]) => {
        const pct = (size / totalSize) * 100;
        return {
          name,
          size,
          pct,
          color: LANGUAGE_COLORS[name] || '#8b949e'
        };
      })
      .sort((a, b) => b.size - a.size);

    return list;
  }, [repos]);

  // Filtered languages for search dropdown
  const uniqueLanguages = useMemo(() => {
    const list = new Set<string>();
    repos.forEach((repo) => {
      if (repo.language) list.add(repo.language);
    });
    return Array.from(list).sort();
  }, [repos]);

  // Filters & Sorting implementation
  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;

        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'forks') return b.forks_count - a.forks_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        // Default: 'updated'
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [repos, searchQuery, selectedLanguage, sortBy]);

  // Event stream printer renderer
  const renderEvent = (event: GitHubEvent) => {
    const repoName = event.repo.name.replace(`${DEFAULT_USERNAME}/`, '');
    const timeStr = new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    switch (event.type) {
      case 'PushEvent': {
        const commitCount = event.payload.commits?.length || 0;
        const ref = event.payload.ref?.replace('refs/heads/', '') || 'main';
        const lastCommitMsg = event.payload.commits?.[0]?.message || '';
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag push">PUSH</span>
            <span>Committed {commitCount} commit(s) to <span className="term-repo">{ref}</span> in <strong>{repoName}</strong></span>
            {lastCommitMsg && <span className="term-detail">&gt; {lastCommitMsg}</span>}
          </div>
        );
      }
      case 'CreateEvent': {
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag create">CREATE</span>
            <span>Created {event.payload.ref_type} <span className="term-repo">{event.payload.ref || ''}</span> on <strong>{repoName}</strong></span>
          </div>
        );
      }
      case 'WatchEvent': {
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag star">STAR</span>
            <span>Starred repository <strong>{repoName}</strong></span>
          </div>
        );
      }
      case 'ForkEvent': {
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag fork">FORK</span>
            <span>Forked <strong>{repoName}</strong> into <strong>{event.payload.forkee?.full_name || 'fork'}</strong></span>
          </div>
        );
      }
      case 'PullRequestEvent': {
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag pr">PR</span>
            <span>{event.payload.action} PR #{event.payload.pull_request?.number} in <strong>{repoName}</strong></span>
            <span className="term-detail">&gt; {event.payload.pull_request?.title}</span>
          </div>
        );
      }
      case 'IssuesEvent': {
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag issue">ISSUE</span>
            <span>{event.payload.action} Issue #{event.payload.issue?.number} in <strong>{repoName}</strong></span>
            <span className="term-detail">&gt; {event.payload.issue?.title}</span>
          </div>
        );
      }
      default: {
        const actionType = event.type.replace('Event', '');
        return (
          <div className="terminal-line" key={event.id}>
            <span className="term-time">{timeStr}</span>
            <span className="term-tag other">{actionType.toUpperCase()}</span>
            <span>Triggered {actionType} in <strong>{repoName}</strong></span>
          </div>
        );
      }
    }
  };

  // Dynamic Habits Analysis
  const habits = useMemo(() => {
    if (!events.length) return { hourHabit: 'N/A', activeDay: 'N/A', commitCount: 0 };

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    let commitCount = 0;
    
    let maxHour = -1;
    let maxHourCount = 0;
    let maxDay = -1;
    let maxDayCount = 0;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    events.forEach(e => {
      const d = new Date(e.created_at);
      
      // Hourly distribution
      const hour = d.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      if (hourCounts[hour] > maxHourCount) {
        maxHourCount = hourCounts[hour];
        maxHour = hour;
      }

      // Day of week distribution
      const day = d.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      if (dayCounts[day] > maxDayCount) {
        maxDayCount = dayCounts[day];
        maxDay = day;
      }

      // Commit count
      if (e.type === 'PushEvent' && e.payload.commits) {
        commitCount += e.payload.commits.length;
      }
    });

    let hourHabit = "N/A";
    if (maxHour !== -1) {
      if (maxHour >= 5 && maxHour < 9) hourHabit = "Early Bird 🌅 (5am-9am)";
      else if (maxHour >= 9 && maxHour < 17) hourHabit = "Productive Business 💼 (9am-5pm)";
      else if (maxHour >= 17 && maxHour < 22) hourHabit = "Evening Enthusiast 🌙 (5pm-10pm)";
      else hourHabit = "Night Owl 🦉 (10pm-5am)";
    }

    const activeDay = maxDay !== -1 ? dayNames[maxDay] : "N/A";

    return {
      hourHabit,
      activeDay,
      commitCount
    };
  }, [events]);

  // Hourly grid generator: Last 24 Hours
  const activity24h = useMemo(() => {
    const list = [];
    const now = new Date();
    
    // Create hourly slots
    for (let i = 23; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      const slotHour = slotTime.getHours();
      
      // Filter events matching this hour/date
      const count = events.filter((e) => {
        const eTime = new Date(e.created_at);
        const diffMs = now.getTime() - eTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= i && diffHours < (i + 1);
      }).length;

      list.push({
        hour: slotHour,
        label: `${slotHour}:00`,
        count
      });
    }
    return list;
  }, [events]);

  return (
    <div className="dashboard-wrapper">
      {/* Header section with profile */}
      <header className="glass-panel profile-header">
        {loading && !profile ? (
          <>
            <div className="avatar-wrapper skeleton"></div>
            <div className="profile-info" style={{ width: '100%' }}>
              <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }}></div>
              <div className="skeleton" style={{ height: '18px', width: '120px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ height: '40px', width: '80%', marginBottom: '8px' }}></div>
            </div>
            <div className="header-actions">
              <div className="skeleton" style={{ height: '38px', width: '120px' }}></div>
            </div>
          </>
        ) : (
          <>
            <div className="avatar-wrapper">
              <img 
                src={profile?.avatar_url || 'https://github.com/github.png'} 
                alt="Avatar" 
                className="avatar-img" 
              />
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {profile?.name || DEFAULT_USERNAME}
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  LIVE {countdown}s
                </div>
              </div>
              <a 
                href={profile?.html_url || `https://github.com/${DEFAULT_USERNAME}`} 
                target="_blank" 
                rel="noreferrer"
                className="profile-username"
              >
                @{profile?.login || DEFAULT_USERNAME}
              </a>
              <p className="profile-bio">
                {profile?.bio || 'Software Developer & Optimizing Systems for Peak Performance.'}
              </p>
              <div className="profile-meta">
                {profile?.location && (
                  <span className="meta-item">
                    <MapPin size={14} /> {profile.location}
                  </span>
                )}
                {profile?.blog && (
                  <span className="meta-item">
                    <ExternalLink size={14} /> 
                    <a 
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {profile.blog}
                    </a>
                  </span>
                )}
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="btn-primary" 
                onClick={() => loadData(true)} 
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                {refreshing ? 'Syncing...' : 'Sync Live Stats'}
              </button>
            </div>
          </>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
          <button className="btn-secondary" style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }} onClick={() => loadData(true)}>Retry</button>
        </div>
      )}

      {/* KPI Stats cards */}
      <section className="stats-grid">
        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Repositories</span>
            <BookOpen size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : profile?.public_repos || 0}</div>
          <div className="stat-trend">Total public repos</div>
        </div>

        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Total Stars</span>
            <Star size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : stats.totalStars}</div>
          <div className="stat-trend">Aggregated stars</div>
        </div>

        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Forks</span>
            <GitFork size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : stats.totalForks}</div>
          <div className="stat-trend">Forked by others</div>
        </div>

        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Followers</span>
            <Users size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : profile?.followers || 0}</div>
          <div className="stat-trend">Current followers</div>
        </div>

        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Active Repos</span>
            <Activity size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : stats.activeReposCount}</div>
          <div className="stat-trend">Updated in last 30d</div>
        </div>

        <div className="glass-panel stats-card">
          <div className="stat-header">
            <span>Storage Size</span>
            <Database size={16} />
          </div>
          <div className="stat-value">{loading ? '...' : stats.formattedSize}</div>
          <div className="stat-trend">Active codebase size</div>
        </div>
      </section>

      {/* Contribution Calendar */}
      {contributions && (
        <section className="glass-panel contribution-panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
              Contribution Calendar
            </span>
            <span className="repos-count-badge">{contributions.totalContributions.toLocaleString()} contributions</span>
          </div>
          <div className="panel-body">
            <div className="contribution-grid">
              {contributions.weeks.map((week, wi) => (
                <div className="contribution-week" key={wi}>
                  {week.contributionDays.map((day) => {
                    let color = 'rgba(255, 255, 255, 0.06)';
                    if (day.contributionCount > 0 && day.contributionCount <= 3) color = 'var(--contrib-1)';
                    else if (day.contributionCount <= 6) color = 'var(--contrib-2)';
                    else if (day.contributionCount <= 9) color = 'var(--contrib-3)';
                    else if (day.contributionCount > 9) color = 'var(--contrib-4)';
                    return (
                      <div
                        key={day.date}
                        className="contrib-cell"
                        style={{ backgroundColor: color }}
                        title={`${day.date} — ${day.contributionCount} contribution(s)`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="contribution-legend">
              <span>Less</span>
              <div className="contrib-cell" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
              <div className="contrib-cell" style={{ backgroundColor: 'var(--contrib-1)' }} />
              <div className="contrib-cell" style={{ backgroundColor: 'var(--contrib-2)' }} />
              <div className="contrib-cell" style={{ backgroundColor: 'var(--contrib-3)' }} />
              <div className="contrib-cell" style={{ backgroundColor: 'var(--contrib-4)' }} />
              <span>More</span>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="layout-grid">
        
        {/* Left Column: Language details and repos list */}
        <section className="content-panel">
          
          {/* Real-time Language Analytics */}
          <div className="glass-panel languages-box">
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={18} style={{ color: 'var(--accent-cyan)' }} />
              Real-time Language Analytics (Size Weighted)
            </h3>
            {loading ? (
              <>
                <div className="skeleton" style={{ height: '16px', borderRadius: '8px', marginBottom: '20px' }}></div>
                <div className="languages-list">
                  {[1, 2, 3, 4].map((n) => (
                    <div className="lang-item" key={n}>
                      <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '6px' }}></div>
                      <div className="skeleton" style={{ height: '22px', width: '50px' }}></div>
                    </div>
                  ))}
                </div>
              </>
            ) : languagesSummary.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No language statistics found.</p>
            ) : (
              <>
                {/* Visual Bar Stack */}
                <div className="languages-bar-container">
                  {languagesSummary.map((lang) => (
                    <div 
                      key={lang.name}
                      className="language-bar-segment"
                      style={{ 
                        width: `${lang.pct}%`,
                        backgroundColor: lang.color
                      }}
                      title={`${lang.name}: ${lang.pct.toFixed(1)}%`}
                    />
                  ))}
                </div>
                
                {/* Text breakdown */}
                <div className="languages-list">
                  {languagesSummary.map((lang) => (
                    <div className="lang-item" key={lang.name}>
                      <div className="lang-header">
                        <span className="lang-color-dot" style={{ backgroundColor: lang.color }} />
                        <span>{lang.name}</span>
                      </div>
                      <div className="lang-details">
                        <span className="lang-pct">{lang.pct.toFixed(1)}%</span>
                        <span className="lang-size">({(lang.size / 1024).toFixed(1)} MB)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Repository Showcase */}
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
                {/* Search */}
                <div className="search-wrapper">
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="Search repositories..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Language */}
                <select 
                  className="filter-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="All">All Languages</option>
                  {uniqueLanguages.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                {/* Sort dropdown */}
                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
                      <div className="skeleton" style={{ height: '18px', width: '60%', marginBottom: '8px' }}></div>
                      <div className="skeleton" style={{ height: '36px', width: '90%' }}></div>
                    </div>
                    <div className="skeleton" style={{ height: '18px', width: '100%' }}></div>
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
                  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : '#8b949e';
                  return (
                    <div className="glass-panel repo-card" key={repo.id}>
                      <div className="repo-card-top">
                        <div className="repo-name-row">
                          <a 
                            href={repo.html_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="repo-name-link"
                          >
                            {repo.name}
                            <ChevronRight size={14} />
                          </a>
                          <span className="repo-visibility">
                            {repo.fork ? 'Fork' : 'Source'}
                          </span>
                        </div>
                        <p className="repo-desc">{repo.description || 'No description provided.'}</p>
                      </div>

                      <div className="repo-card-bottom">
                        {repo.language ? (
                          <div className="repo-lang-badge">
                            <span className="lang-color-dot" style={{ backgroundColor: langColor }} />
                            <span>{repo.language}</span>
                          </div>
                        ) : (
                          <div className="repo-lang-badge">
                            <span className="lang-color-dot" style={{ backgroundColor: '#8b949e' }} />
                            <span>Unknown</span>
                          </div>
                        )}

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
                            {repo.size > 1024 ? `${(repo.size / 1024).toFixed(1)}MB` : `${repo.size}KB`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* Right Column: API settings, live term stream, habits */}
        <section className="sidebar-panel">

          {/* Pinned Repositories */}
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
                  const langColor = repo.language_color || (repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : '#8b949e');
                  return (
                    <a
                      key={repo.id}
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="pinned-item"
                    >
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

          {/* Terminal Console: Live events feed */}
          <div className="glass-panel">
            <div className="panel-title">
              Live Event Feed (WinTuner OS)
              <TerminalIcon size={16} />
            </div>
            <div style={{ padding: '16px' }}>
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="terminal-title">live_logger.sh</span>
                </div>
                <div className="terminal-body">
                  <div className="terminal-line" style={{ color: 'var(--accent-cyan)' }}>
                    <span>$ ./listen_github_events.sh --user {DEFAULT_USERNAME}</span>
                  </div>
                  <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
                    <span>[SYS] System Initialized. Listening to REST events.</span>
                  </div>
                  
                  {loading && events.length === 0 ? (
                    <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
                      <span>Fetching logs...</span>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
                      <span>No recent events found.</span>
                    </div>
                  ) : (
                    events.map((e) => renderEvent(e))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 24h Activity Map Grid */}
          <div className="glass-panel">
            <div className="panel-title">
              24-Hour Activity Grid
              <Clock size={16} />
            </div>
            <div className="panel-body">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Hourly commitment and activity tracking for the past 24 hours.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(12, 1fr)', 
                gap: '8px', 
                marginBottom: '10px' 
              }}>
                {activity24h.map((slot, index) => {
                  let opacity = 0.1;
                  let color = 'rgba(255, 255, 255, 0.1)';
                  
                  if (slot.count > 0) {
                    opacity = Math.min(0.2 + slot.count * 0.2, 1.0);
                    color = 'var(--accent-cyan)';
                  }

                  return (
                    <div 
                      key={index}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '4px',
                        backgroundColor: color,
                        opacity: opacity,
                        transition: 'all 0.2s',
                        border: slot.count > 0 ? '1px solid rgba(54, 188, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer'
                      }}
                      title={`${slot.label} — ${slot.count} event(s)`}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>24 hours ago</span>
                <span>Active hours (highlighted)</span>
                <span>Now</span>
              </div>
            </div>
          </div>

          {/* Coding Habits */}
          <div className="glass-panel">
            <div className="panel-title">
              Coding Habits Analysis
              <Calendar size={16} />
            </div>
            <div className="panel-body">
              <div className="habit-row">
                <span className="habit-label">
                  <Clock size={14} /> Peak Productivity
                </span>
                <span className="habit-value">{loading ? '...' : habits.hourHabit}</span>
              </div>

              <div className="habit-row">
                <span className="habit-label">
                  <Calendar size={14} /> Most Active Day
                </span>
                <span className="habit-value">{loading ? '...' : habits.activeDay}</span>
              </div>

              <div className="habit-row">
                <span className="habit-label">
                  <Activity size={14} /> Commits in window
                </span>
                <span className="habit-value">{loading ? '...' : habits.commitCount}</span>
              </div>
              
              <div className="habit-row">
                <span className="habit-label">
                  <GithubIcon size={14} /> Current Status
                </span>
                <span className="habit-value" style={{ color: 'var(--accent-green)' }}>ACTIVE</span>
              </div>
            </div>
          </div>

        </section>
      </div>

      <footer className="dashboard-footer">
        <div className="footer-brand">
          <GithubIcon size={16} />
          <span>Real-time GitHub Metrics Dashboard (WinTuner)</span>
        </div>
        <div>
          <span>Updated dynamically every 60s via server-side GitHub API{authenticated ? ' (authenticated)' : ''}.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
