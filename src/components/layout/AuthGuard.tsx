'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/ui/Logo';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Initial Session Check
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasUser = !!session?.user;
        setIsAuthenticated(hasUser);

        if (!hasUser && pathname !== '/login') {
          router.replace('/login');
        } else if (hasUser && pathname === '/login') {
          router.replace('/');
        }
      } catch (err) {
        console.warn('Auth check error:', err);
        setIsAuthenticated(false);
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    };

    checkAuth();

    // 2. Realtime Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const hasUser = !!session?.user;
      setIsAuthenticated(hasUser);

      if (!hasUser && pathname !== '/login') {
        router.replace('/login');
      } else if (hasUser && pathname === '/login') {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // If on /login, let login page render immediately
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // While checking auth on protected routes, show sleek minimalist splash
  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#111111] flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative">
          <div className="absolute -inset-4 bg-[#E4FF6B]/20 rounded-full blur-xl animate-pulse" />
          <Logo className="w-16 h-20 text-[#E4FF6B] relative z-10 animate-bounce" fill="#E4FF6B" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white/60 mt-2">
          <span className="w-2 h-2 rounded-full bg-[#E4FF6B] animate-ping" />
          <span>Memverifikasi Autentikasi...</span>
        </div>
      </div>
    );
  }

  // Authenticated user: render protected children
  return <>{children}</>;
};
