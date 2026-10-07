import { GithubIcon } from '@/components/GithubIcon';
import type { RateLimit } from '@/types/github';

interface Props {
  authenticated: boolean;
  rateLimit?: RateLimit | null;
}

export function DashboardFooter({ authenticated, rateLimit }: Props) {
  const rateText =
    rateLimit?.remaining != null && rateLimit?.limit != null
      ? ` · API ${rateLimit.remaining}/${rateLimit.limit} remaining`
      : '';
  return (
    <footer className="dashboard-footer">
      <div className="footer-brand">
        <GithubIcon size={16} />
        <span>Real-time GitHub Metrics Dashboard (WinTuner)</span>
      </div>
      <div>
        <span>
          Updated dynamically every 60s via server-side GitHub API{authenticated ? ' (authenticated)' : ''}
          {rateText}.
        </span>
      </div>
    </footer>
  );
}
