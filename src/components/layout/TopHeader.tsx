'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw, Calendar, Sun, Moon } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { useTheme } from '@/lib/ThemeContext';
import { QuickAddModal } from '@/components/ui/QuickAddModal';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  onRefresh?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  subtitle,
  badgeText = 'Active Workspace',
  onRefresh,
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { isOnline, refreshAll, isLoading } = useDashboard();
  const { theme, toggleTheme } = useTheme();

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/5">
        {/* Title with clean grotesque font & text pill badge */}
        <div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111111]">
              {title}
            </h1>
            {badgeText && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-bold shadow-xs">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm font-medium text-[#7F847C] mt-1">{subtitle}</p>}
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Today Date Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-black/5 shadow-2xs text-xs font-semibold text-[#111111]">
            <Calendar className="w-3.5 h-3.5 text-[#7F847C]" />
            <span>{todayStr}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            title="Refresh database sync"
            className="p-2.5 rounded-2xl bg-white border border-black/5 shadow-2xs hover:bg-[#EDEFEB] text-[#111111] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#111111]' : ''}`} />
          </button>

          {/* Theme Toggle Button (Light/Dark) */}
          <button
            onClick={toggleTheme}
            type="button"
            title={theme === 'dark' ? 'Ganti ke Mode Terang (Light)' : 'Ganti ke Mode Gelap (Dark)'}
            className="p-2.5 rounded-2xl bg-white border border-black/5 shadow-2xs hover:bg-[#EDEFEB] text-[#111111] transition-all active:scale-95 group"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#E4FF6B] group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[#111111] group-hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Quick CTA Black Button */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-[#222222] transition-all duration-200 shadow-md shadow-black/15 active:scale-95 group"
          >
            <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center font-black group-hover:rotate-90 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </span>
            <span>Tambah Data</span>
          </button>
        </div>
      </header>

      {/* Quick Add Modal */}
      {isQuickAddOpen && <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />}
    </>
  );
};
