import { Clock } from 'lucide-react';
import type { ActivitySlot } from '@/lib/stats';

interface Props {
  slots: ActivitySlot[];
}

export function ActivityGrid({ slots }: Props) {
  return (
    <div className="glass-panel">
      <div className="panel-title">
        24-Hour Activity Grid
        <Clock size={16} />
      </div>
      <div className="panel-body">
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Hourly commitment and activity tracking for the past 24 hours.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          {slots.map((slot, index) => {
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
                  opacity,
                  transition: 'all 0.2s',
                  border:
                    slot.count > 0
                      ? '1px solid rgba(54, 188, 247, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
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
  );
}
