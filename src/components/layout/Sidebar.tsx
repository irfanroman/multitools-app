'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  GraduationCap,
  LineChart,
  BookHeart,
  Flame,
  User,
  LogOut,
  Settings,
  Shield,
  X,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/study', label: 'Study Tools', icon: GraduationCap },
  { href: '/datascience', label: 'Data Science', icon: LineChart },
  { href: '/journal', label: 'Mood & Journal', icon: BookHeart },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { streaks, isOnline } = useDashboard();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check auth user info if logged in (Realtime Listener)
  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (user) {
        setCurrentUserEmail(user.email || null);
        
        // Cek profile di tabel profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const name = profile?.username || profile?.full_name || user.user_metadata?.username || user.user_metadata?.full_name;
        if (name) {
          setCurrentUsername(name);
        } else if (user.email) {
          setCurrentUsername(user.email.split('@')[0]);
        }
      } else {
        setCurrentUserEmail(null);
        setCurrentUsername(null);
      }
    };

    fetchUser();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUserEmail(session.user.email || null);
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        
        const name = profile?.username || profile?.full_name || session.user.user_metadata?.username || session.user.user_metadata?.full_name;
        setCurrentUsername(name || (session.user.email ? session.user.email.split('@')[0] : null));
      } else {
        setCurrentUserEmail(null);
        setCurrentUsername(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  if (pathname === '/login') return null;

  const overallStreak = streaks.find((s) => s.module === 'overall')?.current_streak || 0;

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    router.push('/login');
  };

  const userInitial = (currentUsername || currentUserEmail || 'M')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <aside className="w-18 md:w-20 bg-[#111111] text-white flex flex-col items-center py-6 px-3 justify-between z-30 shrink-0 border-r border-white/5 shadow-2xl relative">
        {/* Brand Icon / Logo */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-[#E4FF6B] text-[#111111] flex items-center justify-center shadow-lg shadow-lime-500/20 hover:scale-105 transition-transform p-2.5"
            title="Dashboard Overview"
          >
            <Logo className="w-6 h-6 text-[#111111]" fill="#111111" />
          </Link>
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isOnline ? 'Cloud' : 'Local'}</span>
          </div>
        </div>

        {/* Navigation Items (Icon-Only with Active Pill) */}
        <nav className="flex flex-col items-center gap-4 my-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-[#E4FF6B] text-[#111111] shadow-md shadow-lime-500/20 font-bold scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {/* Tooltip floating right */}
                <span className="absolute left-16 px-2.5 py-1 rounded-xl bg-[#181818] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-xl">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Streaks & Profile */}
        <div className="flex flex-col items-center gap-3 relative" ref={menuRef}>
          {/* Streak Pill */}
          <div
            title={
              overallStreak > 0
                ? `Overall Streak: ${overallStreak} Hari Berturut-turut`
                : 'Belum ada streak aktif hari ini'
            }
            className={`flex flex-col items-center justify-center w-11 py-2 rounded-2xl border text-center transition-colors ${
              overallStreak > 0
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                overallStreak > 0
                  ? 'text-orange-400 fill-orange-400 animate-bounce'
                  : 'text-neutral-500 fill-none'
              }`}
            />
            <span className={`text-[11px] font-black mt-0.5 ${overallStreak > 0 ? 'text-white' : 'text-neutral-400'}`}>
              {overallStreak}d
            </span>
          </div>

          {/* User avatar button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-black transition-all ${
              isMenuOpen
                ? 'border-[#E4FF6B] bg-[#E4FF6B] text-[#111111] scale-105 shadow-md shadow-lime-500/20'
                : 'bg-white/10 border-white/20 text-white hover:border-[#E4FF6B]'
            }`}
            title="Menu Akun & Profil"
          >
            {userInitial}
          </button>

          {/* Floating Dropdown Menu Popover */}
          {isMenuOpen && (
            <div className="absolute left-16 bottom-0 w-56 bg-[#181818] border border-white/10 rounded-3xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-left-2 duration-200">
              {/* User info header */}
              <div className="px-3 py-2 border-b border-white/10 mb-2">
                <div className="text-xs font-black text-white truncate">
                  {currentUsername || 'Data Science Student'}
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  {currentUserEmail || 'student@dashboard.local'}
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4FF6B]" />
                  <span className="text-[9px] font-bold text-[#E4FF6B] uppercase tracking-wider">Active Workspace</span>
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-[#E4FF6B]" />
                  <span>Profile & Akun</span>
                </button>

                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-[#7F847C]" />
                  <span>Ganti Akun / Login</span>
                </Link>

                <div className="pt-1 border-t border-white/5 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Profile Detail Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#E4FF6B] text-[#111111]">
                  <User className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-white">Student Profile</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar & Role Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E4FF6B] text-[#111111] text-xl flex items-center justify-center font-black">
                  {userInitial}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    {currentUsername || 'Data Science Student'}
                  </h4>
                  <p className="text-xs text-white/50">{currentUserEmail || 'student@dashboard.local'}</p>
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block mb-0.5">Overall Streak</span>
                  <span className="text-base font-black text-[#E4FF6B]">{overallStreak} Hari</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block mb-0.5">Database Status</span>
                  <span className="text-base font-black text-emerald-400">
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-extrabold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2 rounded-2xl bg-[#E4FF6B] text-[#111111] text-xs font-black hover:bg-[#d2f347] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
