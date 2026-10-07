import { useMemo } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { bucketActivity24h, computeHabits, computeLanguages, computeStats } from '@/lib/stats';
import { DEFAULT_USERNAME } from '@/lib/constants';
import { ProfileHeader } from '@/components/ProfileHeader';
import { StatsGrid } from '@/components/StatsGrid';
import { ContributionCalendar } from '@/components/ContributionCalendar';
import { LanguageAnalytics } from '@/components/LanguageAnalytics';
import { RepoShowcase } from '@/components/RepoShowcase';
import { PinnedList } from '@/components/PinnedList';
import { EventTerminal } from '@/components/EventTerminal';
import { ActivityGrid } from '@/components/ActivityGrid';
import { HabitsPanel } from '@/components/HabitsPanel';
import { StatusBanners } from '@/components/StatusBanners';
import { DashboardFooter } from '@/components/DashboardFooter';

function App() {
  const {
    profile,
    repos,
    events,
    pinned,
    contributions,
    authenticated,
    warnings,
    loading,
    refreshing,
    error,
    countdown,
    refresh,
  } = useDashboard();

  const username = profile?.login ?? DEFAULT_USERNAME;
  const stats = useMemo(() => computeStats(repos), [repos]);
  const languages = useMemo(() => computeLanguages(repos), [repos]);
  const habits = useMemo(() => computeHabits(events), [events]);
  const activitySlots = useMemo(() => bucketActivity24h(events), [events]);

  return (
    <div className="dashboard-wrapper">
      <ProfileHeader
        profile={profile}
        loading={loading}
        countdown={countdown}
        refreshing={refreshing}
        onRefresh={() => refresh()}
      />

      <StatusBanners error={error} warnings={warnings} onRetry={() => refresh()} />

      <StatsGrid profile={profile} stats={stats} loading={loading} />

      <ContributionCalendar contributions={contributions} />

      <div className="layout-grid">
        <section className="content-panel">
          <LanguageAnalytics languages={languages} loading={loading} />
          <RepoShowcase repos={repos} loading={loading} />
        </section>

        <section className="sidebar-panel">
          <PinnedList pinned={pinned} loading={loading} />
          <EventTerminal events={events} loading={loading} username={username} />
          <ActivityGrid slots={activitySlots} />
          <HabitsPanel habits={habits} loading={loading} />
        </section>
      </div>

      <DashboardFooter authenticated={authenticated} />
    </div>
  );
}

export default App;
