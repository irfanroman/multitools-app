'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Recharts is ~360 KB of the client bundle — more than every other dependency
 * combined. Loading it eagerly meant every route paid for it (the shared
 * chunk graph pulled it into /finance, /journal and /datascience alike) even
 * though charts sit below the fold on all three.
 *
 * These wrappers move it into its own chunk fetched after first paint.
 * `ssr: false` is deliberate: recharts measures the DOM, so its server output
 * is a throwaway that only inflates the HTML payload.
 */

const ChartSkeleton: React.FC<{ height: string }> = ({ height }) => (
  <div
    className={`${height} w-full rounded-2xl bg-subtle-soft animate-pulse`}
    aria-hidden="true"
  />
);

export const ExpenseDonutChart = dynamic(
  () => import('@/components/finance/ExpenseDonutChart').then((m) => m.ExpenseDonutChart),
  {
    ssr: false,
    loading: () => (
      <div className="card-base h-full">
        <ChartSkeleton height="h-60" />
      </div>
    ),
  }
);

export const CashFlowChart = dynamic(
  () => import('@/components/finance/CashFlowChart').then((m) => m.CashFlowChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-44" /> }
);

export const MoodTrendChart = dynamic(
  () => import('@/components/journal/MoodTrendChart').then((m) => m.MoodTrendChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-64" /> }
);

export const DatasetChart = dynamic(
  () => import('@/components/datascience/DatasetChart').then((m) => m.DatasetChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-72" /> }
);
