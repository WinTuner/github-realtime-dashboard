import { Activity, Calendar, Clock } from 'lucide-react';
import type { Habits } from '@/lib/stats';
import { GithubIcon } from '@/components/GithubIcon';

interface Props {
  habits: Habits;
  loading: boolean;
}

export function HabitsPanel({ habits, loading }: Props) {
  const v = (s: string | number) => (loading ? '...' : s);
  return (
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
          <span className="habit-value">{v(habits.hourHabit)}</span>
        </div>

        <div className="habit-row">
          <span className="habit-label">
            <Calendar size={14} /> Most Active Day
          </span>
          <span className="habit-value">{v(habits.activeDay)}</span>
        </div>

        <div className="habit-row">
          <span className="habit-label">
            <Activity size={14} /> Commits in window
          </span>
          <span className="habit-value">{v(habits.commitCount)}</span>
        </div>

        <div className="habit-row">
          <span className="habit-label">
            <GithubIcon size={14} /> Current Status
          </span>
          <span className="habit-value" style={{ color: 'var(--accent-green)' }}>
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
