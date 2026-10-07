import { Calendar } from 'lucide-react';
import type { Contributions } from '@/types/github';
import { getContributionColor } from '@/lib/format';

interface Props {
  contributions: Contributions | null;
}

export function ContributionCalendar({ contributions }: Props) {
  if (!contributions) return null;
  return (
    <section className="glass-panel contribution-panel" aria-label="Contribution calendar">
      <div className="panel-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
          Contribution Calendar
        </span>
        <span className="repos-count-badge">
          {contributions.totalContributions.toLocaleString()} contributions
        </span>
      </div>
      <div className="panel-body">
        <div className="contribution-grid">
          {contributions.weeks.map((week, wi) => (
            <div className="contribution-week" key={wi}>
              {week.contributionDays.map((day) => (
                <div
                  key={day.date}
                  className="contrib-cell"
                  style={{ backgroundColor: getContributionColor(day.contributionCount) }}
                  title={`${day.date} — ${day.contributionCount} contribution(s)`}
                />
              ))}
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
  );
}
