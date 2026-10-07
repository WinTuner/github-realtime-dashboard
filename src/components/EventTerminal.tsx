import { memo, useMemo, useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import type { GitHubEvent } from '@/types/github';
import { DEFAULT_USERNAME } from '@/lib/constants';
import { formatEventTime, stripRepoPrefix } from '@/lib/format';

interface Props {
  events: GitHubEvent[];
  loading: boolean;
  username?: string;
}

function EventLine({ event, username }: { event: GitHubEvent; username: string }) {
  const repoName = stripRepoPrefix(event.repo.name, username);
  const timeStr = formatEventTime(event.created_at);

  switch (event.type) {
    case 'PushEvent': {
      const commits =
        event.payload.commits && event.payload.commits.length > 0 ? event.payload.commits : undefined;
      const count = commits?.length ?? event.payload.size ?? event.payload.distinct_size ?? 0;
      const ref = event.payload.ref?.replace('refs/heads/', '') || 'main';
      const lastCommitMsg = commits?.[0]?.message || '';
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag push">PUSH</span>
          <span>
            {commits ? (
              <>
                Committed {count} commit(s) to <span className="term-repo">{ref}</span> in{' '}
                <strong>{repoName}</strong>
              </>
            ) : (
              <>
                Pushed {count > 0 ? `${count} commit(s)` : 'commits'} to{' '}
                <span className="term-repo">{ref}</span> in <strong>{repoName}</strong>
              </>
            )}
          </span>
          {lastCommitMsg && <span className="term-detail">&gt; {lastCommitMsg}</span>}
        </div>
      );
    }
    case 'CreateEvent': {
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag create">CREATE</span>
          <span>
            Created {event.payload.ref_type} <span className="term-repo">{event.payload.ref || ''}</span> on{' '}
            <strong>{repoName}</strong>
          </span>
        </div>
      );
    }
    case 'WatchEvent': {
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag star">STAR</span>
          <span>
            Starred repository <strong>{repoName}</strong>
          </span>
        </div>
      );
    }
    case 'ForkEvent': {
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag fork">FORK</span>
          <span>
            Forked <strong>{repoName}</strong> into <strong>{event.payload.forkee?.full_name || 'fork'}</strong>
          </span>
        </div>
      );
    }
    case 'PullRequestEvent': {
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag pr">PR</span>
          <span>
            {event.payload.action} PR #{event.payload.pull_request?.number} in <strong>{repoName}</strong>
          </span>
          <span className="term-detail">&gt; {event.payload.pull_request?.title}</span>
        </div>
      );
    }
    case 'IssuesEvent': {
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag issue">ISSUE</span>
          <span>
            {event.payload.action} Issue #{event.payload.issue?.number} in <strong>{repoName}</strong>
          </span>
          <span className="term-detail">&gt; {event.payload.issue?.title}</span>
        </div>
      );
    }
    default: {
      const actionType = event.type.replace('Event', '');
      return (
        <div className="terminal-line">
          <span className="term-time">{timeStr}</span>
          <span className="term-tag other">{actionType.toUpperCase()}</span>
          <span>
            Triggered {actionType} in <strong>{repoName}</strong>
          </span>
        </div>
      );
    }
  }
}

const MemoEventLine = memo(EventLine);

export function EventTerminal({ events, loading, username = DEFAULT_USERNAME }: Props) {
  const [filter, setFilter] = useState('All');

  const visibleEvents = useMemo(() => {
    if (filter === 'All') return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  return (
    <div className="glass-panel">
      <div className="panel-title">
        Live Event Feed (WinTuner OS)
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter events by type"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            <option value="All">All events</option>
            <option value="PushEvent">Pushes</option>
            <option value="PullRequestEvent">Pull requests</option>
            <option value="IssuesEvent">Issues</option>
            <option value="WatchEvent">Stars</option>
            <option value="ForkEvent">Forks</option>
            <option value="CreateEvent">Creates</option>
          </select>
          <TerminalIcon size={16} />
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="terminal-title">live_logger.sh</span>
          </div>
          <div className="terminal-body" aria-live="polite">
            <div className="terminal-line" style={{ color: 'var(--accent-cyan)' }}>
              <span>$ ./listen_github_events.sh --user {username}</span>
            </div>
            <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
              <span>[SYS] System Initialized. Listening to REST events.</span>
            </div>

            {loading && events.length === 0 ? (
              <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
                <span>Fetching logs...</span>
              </div>
            ) : visibleEvents.length === 0 ? (
              <div className="terminal-line" style={{ color: 'var(--text-muted)' }}>
                <span>No recent events found{filter !== 'All' ? ' for this filter.' : '.'}</span>
              </div>
            ) : (
              visibleEvents.map((e) => <MemoEventLine key={e.id} event={e} username={username} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
