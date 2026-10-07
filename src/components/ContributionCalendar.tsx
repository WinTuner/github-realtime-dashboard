import { Calendar } from 'lucide-react';
import type { Contributions } from '@/types/github';
import { getContributionColor } from '@/lib/format';

interface Props {
  contributions: Contributions | null;
}

export function ContributionCalendar({ contributions }: Props) {
  if (!contributions) return null;

  const monthLabels: Array<{ index: number; label: string }> = [];
  let lastMonth = '';
  contributions.weeks.forEach((week, wi) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;
    const month = new Date(`${firstDay.date}T00:00:00Z`).toLocaleString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    });
    if (month !== lastMonth) {
      lastMonth = month;
      monthLabels.push({ index: wi, label: month });
    }
  });

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
        <div
          style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '4px' }}
          aria-hidden="true"
        >
          {contributions.weeks.map((_week, wi) => {
            const label = monthLabels.find((m) => m.index === wi);
            return (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', height: '14px' }}>
                  {label?.label ?? ''}
                </span>
              </div>
            );
          })}
        </div>
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
