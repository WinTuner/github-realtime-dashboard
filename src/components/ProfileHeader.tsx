import { ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import type { Profile } from '@/types/github';
import { DEFAULT_USERNAME } from '@/lib/constants';
import { normalizeBlogUrl } from '@/lib/format';

interface Props {
  profile: Profile | null;
  loading: boolean;
  countdown: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ProfileHeader({ profile, loading, countdown, refreshing, onRefresh }: Props) {
  if (loading && !profile) {
    return (
      <header className="glass-panel profile-header">
        <div className="avatar-wrapper skeleton" />
        <div className="profile-info" style={{ width: '100%' }}>
          <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '18px', width: '120px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '40px', width: '80%', marginBottom: '8px' }} />
        </div>
        <div className="header-actions">
          <div className="skeleton" style={{ height: '38px', width: '120px' }} />
        </div>
      </header>
    );
  }

  return (
    <header className="glass-panel profile-header">
      <div className="avatar-wrapper">
        <img
          src={profile?.avatar_url || 'https://github.com/github.png'}
          alt={`${profile?.login ?? DEFAULT_USERNAME} avatar`}
          className="avatar-img"
          loading="lazy"
        />
      </div>
      <div className="profile-info">
        <div className="profile-name">
          {profile?.name || DEFAULT_USERNAME}
          <div className="live-indicator" aria-live="polite">
            <span className="live-dot" />
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
                href={normalizeBlogUrl(profile.blog)}
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
        <button className="btn-primary" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Syncing...' : 'Sync Live Stats'}
        </button>
      </div>
    </header>
  );
}
