import { ShieldAlert } from 'lucide-react';

interface Props {
  error: string | null;
  warnings: string[];
  onRetry: () => void;
}

export function StatusBanners({ error, warnings, onRetry }: Props) {
  if (!error && warnings.length === 0) return null;
  return (
    <>
      {error && (
        <div className="error-banner" role="alert">
          <ShieldAlert size={16} />
          <span>{error}</span>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}
      {warnings.length > 0 && (
        <div
          className="error-banner"
          role="status"
          style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d' }}
        >
          <ShieldAlert size={16} />
          <span>Partial data: {warnings.join(' · ')}</span>
        </div>
      )}
    </>
  );
}
