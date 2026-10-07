import { Suspense, lazy, useMemo } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { bucketActivity24h, computeHabits, computeLanguages, computeStats } from '@/lib/stats';
import { DEFAULT_USERNAME } from '@/lib/constants';
import { ProfileHeader } from '@/components/ProfileHeader';
import { StatsGrid } from '@/components/StatsGrid';
import { StatusBanners } from '@/components/StatusBanners';
import { DashboardFooter } from '@/components/DashboardFooter';

const ContributionCalendar = lazy(() =>
  import('@/components/ContributionCalendar').then((m) => ({ default: m.ContributionCalendar })),
);
const LanguageAnalytics = lazy(() =>
  import('@/components/LanguageAnalytics').then((m) => ({ default: m.LanguageAnalytics })),
);
const RepoShowcase = lazy(() =>
  import('@/components/RepoShowcase').then((m) => ({ default: m.RepoShowcase })),
);
const PinnedList = lazy(() =>
  import('@/components/PinnedList').then((m) => ({ default: m.PinnedList })),
);
const EventTerminal = lazy(() =>
  import('@/components/EventTerminal').then((m) => ({ default: m.EventTerminal })),
);
const ActivityGrid = lazy(() =>
  import('@/components/ActivityGrid').then((m) => ({ default: m.ActivityGrid })),
);
const HabitsPanel = lazy(() =>
  import('@/components/HabitsPanel').then((m) => ({ default: m.HabitsPanel })),
);

function PanelFallback() {
  return <div className="glass-panel skeleton" style={{ height: '180px' }} aria-hidden="true" />;
}

function App() {
  const {
    profile,
    repos,
    events,
    pinned,
    contributions,
    authenticated,
    rateLimit,
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2"
      >
        Skip to content
      </a>
      <ProfileHeader
        profile={profile}
        loading={loading}
        countdown={countdown}
        refreshing={refreshing}
        onRefresh={() => refresh()}
      />

      <StatusBanners error={error} warnings={warnings} onRetry={() => refresh()} />

      <main id="main-content" style={{ display: 'contents' }}>
        <StatsGrid profile={profile} stats={stats} loading={loading} />

        <Suspense fallback={<PanelFallback />}>
          <ContributionCalendar contributions={contributions} />
        </Suspense>

        <div className="layout-grid">
          <section className="content-panel" aria-label="Repositories and languages">
            <Suspense fallback={<PanelFallback />}>
              <LanguageAnalytics languages={languages} loading={loading} />
            </Suspense>
            <Suspense fallback={<PanelFallback />}>
              <RepoShowcase repos={repos} loading={loading} />
            </Suspense>
          </section>

          <aside className="sidebar-panel" aria-label="Live activity">
            <Suspense fallback={<PanelFallback />}>
              <PinnedList pinned={pinned} loading={loading} />
            </Suspense>
            <Suspense fallback={<PanelFallback />}>
              <EventTerminal events={events} loading={loading} username={username} />
            </Suspense>
            <Suspense fallback={<PanelFallback />}>
              <ActivityGrid slots={activitySlots} />
            </Suspense>
            <Suspense fallback={<PanelFallback />}>
              <HabitsPanel habits={habits} loading={loading} />
            </Suspense>
          </aside>
        </div>
      </main>

      <DashboardFooter authenticated={authenticated} rateLimit={rateLimit} />
    </div>
  );
}

export default App;
