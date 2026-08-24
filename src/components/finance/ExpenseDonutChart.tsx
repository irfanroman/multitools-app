'use client';

import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DonutDataItem {
  name: string;
  value: number;
  color: string;
}

interface ExpenseDonutChartProps {
  data: DonutDataItem[];
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({ data }) => {
  return (
    <div className="card-base flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="heading-sm flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            <span>Breakdown Pengeluaran</span>
          </h3>
          <span className="section-subtitle">Bulan Ini</span>
        </div>
        <p className="section-subtitle mb-4">Proporsi pengeluaran berdasarkan kategori</p>

        {data.length > 0 ? (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Nominal']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center section-subtitle">
            Belum ada data pengeluaran bulan ini.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
        {data.map((d) => (
          <span
            key={d.name}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#111111] bg-[#EDEFEB] px-2.5 py-1 rounded-full"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="capitalize">{d.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
