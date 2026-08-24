'use client';

import { useMemo } from 'react';
import { useTheme } from './ThemeContext';

export interface ChartTheme {
  grid: string;
  axis: string;
  /** Primary series stroke/fill. Black in light, lime in dark. */
  ink: string;
  income: string;
  expense: string;
  accent: string;
  /** Props to spread onto a recharts <Tooltip /> so it follows the theme. */
  tooltip: {
    contentStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    cursor: { fill: string } | { stroke: string };
  };
}

const LIGHT: Omit<ChartTheme, 'tooltip'> = {
  grid: 'rgba(0,0,0,0.06)',
  axis: '#7F847C',
  ink: '#111111',
  income: '#10B981',
  expense: '#111111',
  accent: '#E4FF6B',
};

const DARK: Omit<ChartTheme, 'tooltip'> = {
  grid: 'rgba(255,255,255,0.08)',
  axis: '#9CA3AF',
  // #111111 on a #16181D card is invisible — the accent carries the series.
  ink: '#E4FF6B',
  income: '#34D399',
  expense: '#E4FF6B',
  accent: '#E4FF6B',
};

/**
 * Recharts renders to SVG with inline attributes, so CSS variables and the
 * `dark:` variant cannot reach it. This resolves the palette in JS instead.
 */
export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();

  return useMemo(() => {
    const isDark = theme === 'dark';
    const base = isDark ? DARK : LIGHT;

    return {
      ...base,
      tooltip: {
        contentStyle: {
          backgroundColor: isDark ? '#1F2228' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '0.75rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.6)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          padding: '0.5rem 0.75rem',
        },
        itemStyle: { color: isDark ? '#F3F4F6' : '#111111' },
        labelStyle: {
          color: isDark ? '#9CA3AF' : '#7F847C',
          marginBottom: '0.25rem',
        },
        cursor: { fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
      },
    };
  }, [theme]);
}
