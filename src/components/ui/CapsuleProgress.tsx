'use client';

import React from 'react';

interface CapsuleProgressProps {
  label: string;
  spent: number;
  limit: number;
  unit?: string;
  isOverBudget?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const CapsuleProgress: React.FC<CapsuleProgressProps> = ({
  label,
  spent,
  limit,
  unit = 'Rp',
  orientation = 'vertical',
  className = '',
}) => {
  const percentage = Math.min(Math.round((spent / (limit || 1)) * 100), 100);
  const isOver = spent > limit;
  const isWarning = percentage >= 80 && !isOver;

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {/* Value pill */}
        <span className="text-[11px] font-semibold text-[#111111] bg-white px-2 py-0.5 rounded-full border border-black/5 shadow-xs">
          {percentage}%
        </span>

        {/* Capsule slider track */}
        <div className="relative w-7 h-28 bg-[#EDEFEB] rounded-full p-1 flex flex-col justify-end border border-black/5 overflow-hidden shadow-inner">
          <div
            className={`w-full rounded-full transition-all duration-700 ease-out ${
              isOver
                ? 'bg-rose-500 shadow-sm shadow-rose-300'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-[#E4FF6B] border border-black/10'
            }`}
            style={{ height: `${percentage}%` }}
          />
        </div>

        {/* Label */}
        <span className="text-[11px] font-medium text-[#7F847C] capitalize truncate max-w-[64px] text-center">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-[#111111] capitalize">{label}</span>
        <span className="text-[11px] text-[#7F847C]">
          {unit} {spent.toLocaleString('id-ID')} / {limit.toLocaleString('id-ID')} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-3.5 bg-[#EDEFEB] rounded-full p-0.5 border border-black/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-[#E4FF6B] border border-black/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
