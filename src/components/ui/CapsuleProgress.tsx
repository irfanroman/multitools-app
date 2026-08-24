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

const CapsuleProgressImpl: React.FC<CapsuleProgressProps> = ({
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
        <span className="text-[11px] font-semibold surface-chip px-2 py-0.5 rounded-full">
          {percentage}%
        </span>

        {/* Capsule slider track */}
        <div className="relative w-7 h-28 bg-subtle rounded-full p-1 flex flex-col justify-end border border-subtle overflow-hidden shadow-inner">
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
        <span className="text-[11px] font-medium text-muted capitalize truncate max-w-[64px] text-center">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold capitalize">{label}</span>
        <span className="text-[11px] text-muted">
          {unit} {spent.toLocaleString('id-ID')} / {limit.toLocaleString('id-ID')} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-3.5 bg-subtle rounded-full p-0.5 border border-subtle overflow-hidden">
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

export const CapsuleProgress = React.memo(CapsuleProgressImpl);
