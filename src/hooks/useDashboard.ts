import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DashboardResponse } from '@/types/github';
import { POLL_INTERVAL_MS, POLL_INTERVAL_S } from '@/lib/constants';

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/github');
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Failed to load dashboard (${res.status})`;
    throw new Error(message);
  }
  const data = (await res.json()) as DashboardResponse;
  return {
    profile: data.profile ?? null,
    repos: data.repos ?? [],
    events: data.events ?? [],
    pinned: data.pinned ?? [],
    contributions: data.contributions ?? null,
    authenticated: data.authenticated ?? false,
    rateLimit: data.rateLimit ?? null,
    warnings: data.warnings ?? [],
  };
}

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
    retry: 2,
    staleTime: 30_000,
  });

  const [countdown, setCountdown] = useState<number>(POLL_INTERVAL_S);
  const updatedAt = query.dataUpdatedAt;

  useEffect(() => {
    setCountdown(POLL_INTERVAL_S);
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? POLL_INTERVAL_S : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [updatedAt]);

  return {
    profile: query.data?.profile ?? null,
    repos: query.data?.repos ?? [],
    events: query.data?.events ?? [],
    pinned: query.data?.pinned ?? [],
    contributions: query.data?.contributions ?? null,
    authenticated: query.data?.authenticated ?? false,
    rateLimit: query.data?.rateLimit ?? null,
    warnings: query.data?.warnings ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    countdown,
    refresh: () => query.refetch(),
  };
}
