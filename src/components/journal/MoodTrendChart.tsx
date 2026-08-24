'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '@/lib/useChartTheme';

export interface MoodPoint {
  date: string;
  score: number;
  tag: string;
}

const Y_TICKS = [1, 2, 3, 4, 5];
const Y_DOMAIN: [number, number] = [1, 5];

const fmtScore = (val: unknown): [string, string] => [`Skor: ${val} / 5`, 'Mood Level'];

const MoodTrendChartImpl: React.FC<{ data: MoodPoint[] }> = ({ data }) => {
  const t = useChartTheme();

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center section-subtitle">
        Belum ada catatan mood. Isi refleksi untuk melihat grafik.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={t.accent} stopOpacity={0.8} />
              <stop offset="95%" stopColor={t.accent} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
          <XAxis dataKey="date" stroke={t.axis} fontSize={11} tickLine={false} />
          <YAxis
            domain={Y_DOMAIN}
            ticks={Y_TICKS}
            stroke={t.axis}
            fontSize={11}
            tickLine={false}
          />
          <Tooltip formatter={fmtScore} {...t.tooltip} />
          {/* Was stroke="#111111" — invisible against the dark card. */}
          <Area
            type="monotone"
            dataKey="score"
            stroke={t.ink}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#moodGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MoodTrendChart = React.memo(MoodTrendChartImpl);
