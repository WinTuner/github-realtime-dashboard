import { GithubIcon } from '@/components/GithubIcon';

interface Props {
  authenticated: boolean;
}

export function DashboardFooter({ authenticated }: Props) {
  return (
    <footer className="dashboard-footer">
      <div className="footer-brand">
        <GithubIcon size={16} />
        <span>Real-time GitHub Metrics Dashboard (WinTuner)</span>
      </div>
      <div>
        <span>
          Updated dynamically every 60s via server-side GitHub API{authenticated ? ' (authenticated)' : ''}.
        </span>
      </div>
    </footer>
  );
}
