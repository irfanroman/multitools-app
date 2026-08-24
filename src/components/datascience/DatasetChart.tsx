'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '@/lib/useChartTheme';

interface DatasetChartProps {
  data: Record<string, unknown>[];
  xAxisCol: string;
  yAxisCol: string;
  chartType: 'bar' | 'line';
}

/** Plotting more than this is unreadable and costs a DOM node per point. */
const MAX_POINTS = 30;

const DatasetChartImpl: React.FC<DatasetChartProps> = ({
  data,
  xAxisCol,
  yAxisCol,
  chartType,
}) => {
  const t = useChartTheme();

  // slice() allocated a fresh array on every parent render, defeating the
  // memo on the chart underneath it.
  const points = useMemo(() => data.slice(0, MAX_POINTS), [data]);

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
      <XAxis dataKey={xAxisCol} stroke={t.axis} fontSize={10} tickLine={false} />
      <YAxis stroke={t.axis} fontSize={10} tickLine={false} />
      <Tooltip {...t.tooltip} />
    </>
  );

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            {axes}
            {/* Was fill="#111111" — black bars on a near-black card. */}
            <Bar dataKey={yAxisCol} fill={t.ink} radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        ) : (
          <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            {axes}
            <Line
              type="monotone"
              dataKey={yAxisCol}
              stroke={t.ink}
              strokeWidth={2}
              dot={{ fill: t.accent, r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export const DatasetChart = React.memo(DatasetChartImpl);
