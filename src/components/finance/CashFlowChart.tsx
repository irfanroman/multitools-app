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

interface AreaDataItem {
  date: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: AreaDataItem[];
}

const fmtIDR = (val: unknown) => `Rp ${Number(val ?? 0).toLocaleString('id-ID')}`;
const fmtAxis = (v: number) => `${Math.round(v / 1000)}k`;

const CashFlowChartImpl: React.FC<CashFlowChartProps> = ({ data }) => {
  const t = useChartTheme();

  return (
    <div className="pt-4 border-t border-subtle">
      <h4 className="text-xs font-extrabold mb-2 uppercase tracking-wider">
        Tren Arus Kas (Income vs Expense)
      </h4>
      <div className="h-44 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.income} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={t.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.accent} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
              <XAxis dataKey="date" stroke={t.axis} fontSize={10} tickLine={false} />
              <YAxis stroke={t.axis} fontSize={10} tickLine={false} tickFormatter={fmtAxis} />
              <Tooltip formatter={fmtIDR} {...t.tooltip} />
              <Area
                type="monotone"
                dataKey="income"
                stroke={t.income}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGrad)"
                name="Pemasukan"
                isAnimationActive={false}
              />
              {/* Was hard-coded #111111 — a black line on a #16181D card. */}
              <Area
                type="monotone"
                dataKey="expense"
                stroke={t.expense}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGrad)"
                name="Pengeluaran"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center section-subtitle">
            Belum ada histori transaksi untuk grafik arus kas.
          </div>
        )}
      </div>
    </div>
  );
};

export const CashFlowChart = React.memo(CashFlowChartImpl);
