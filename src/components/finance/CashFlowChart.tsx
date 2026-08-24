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

interface AreaDataItem {
  date: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: AreaDataItem[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  return (
    <div className="pt-4 border-t border-black/5">
      <h4 className="text-xs font-extrabold text-[#111111] mb-2 uppercase tracking-wider">
        Tren Arus Kas (Income vs Expense)
      </h4>
      <div className="h-44 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E4FF6B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#E4FF6B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" stroke="#7F847C" fontSize={10} />
              <YAxis stroke="#7F847C" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]} />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Pemasukan" />
              <Area type="monotone" dataKey="expense" stroke="#111111" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Pengeluaran" />
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
