import { Code2 } from 'lucide-react';
import type { LanguageSummary } from '@/lib/stats';

interface Props {
  languages: LanguageSummary[];
  loading: boolean;
}

export function LanguageAnalytics({ languages, loading }: Props) {
  return (
    <div className="glass-panel languages-box">
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Code2 size={18} style={{ color: 'var(--accent-cyan)' }} />
        Real-time Language Analytics (Size Weighted)
      </h3>
      {loading ? (
        <>
          <div className="skeleton" style={{ height: '16px', borderRadius: '8px', marginBottom: '20px' }} />
          <div className="languages-list">
            {[1, 2, 3, 4].map((n) => (
              <div className="lang-item" key={n}>
                <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '22px', width: '50px' }} />
              </div>
            ))}
          </div>
        </>
      ) : languages.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No language statistics found.</p>
      ) : (
        <>
          <div className="languages-bar-container">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="language-bar-segment"
                style={{ width: `${lang.pct}%`, backgroundColor: lang.color }}
                title={`${lang.name}: ${lang.pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="languages-list">
            {languages.map((lang) => (
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
  );
}
