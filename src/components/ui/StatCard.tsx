'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeType?: 'lime' | 'dark' | 'success' | 'danger' | 'neutral';
  variant?: 'dark' | 'lime' | 'white';
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
}

const StatCardImpl: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'lime',
  variant = 'white',
  icon,
  actionButton,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return 'card-dark bg-[#111111] text-white border-black/80 shadow-lg shadow-black/10';
      case 'lime':
        return 'card-lime bg-[#E4FF6B] text-[#111111] border-black/10 shadow-md shadow-lime-500/10';
      case 'white':
      default:
        return 'card-base';
    }
  };

  const getBadgeStyles = () => {
    switch (badgeType) {
      case 'lime':
        return 'bg-[#E4FF6B] text-[#111111] border-black/10';
      case 'dark':
        return 'bg-[#111111] text-white';
      case 'success':
        return 'bg-emerald-100 text-emerald-800';
      case 'danger':
        return 'bg-rose-100 text-rose-800';
      case 'neutral':
      default:
        return 'bg-subtle text-muted';
    }
  };

  return (
    <div
      className={`relative p-5 rounded-3xl border transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between ${getVariantStyles()} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className={`p-2 rounded-2xl ${
                variant === 'dark'
                  ? 'bg-white/10 text-[#E4FF6B]'
                  : variant === 'lime'
                  ? 'bg-black/10 text-[#111111]'
                  : 'bg-subtle'
              }`}
            >
              {icon}
            </div>
          )}
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              variant === 'dark' ? 'text-white/60' : variant === 'lime' ? 'text-[#111111]/80 font-bold' : 'text-muted'
            }`}
          >
            {title}
          </span>
        </div>

        {badgeText && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${getBadgeStyles()}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight mb-1 ${variant === 'lime' ? 'text-[#111111]' : ''}`}>
          {value}
        </div>
        {subtitle && (
          <p
            className={`text-xs font-medium ${
              variant === 'dark' ? 'text-white/60' : variant === 'lime' ? 'text-[#111111]/80 font-semibold' : 'text-muted'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actionButton && (
        <div className="mt-3 pt-3 border-t border-current/15">{actionButton}</div>
      )}
    </div>
  );
};

export const StatCard = React.memo(StatCardImpl);
