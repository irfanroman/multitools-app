'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/ui/Logo';

/**
 * Session state is process-wide, not route-scoped. Keeping the subscription in
 * an effect keyed on `pathname` (as before) tore down and rebuilt the auth
 * listener — and re-ran getSession() — on every single navigation.
 *
 * Here the listener is created once; a ref carries the current pathname into
 * it so redirects still target the right route.
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const pathRef = useRef(pathname);
  const routerRef = useRef(router);

  // Synced after commit — writing a ref during render is unsafe under
  // concurrent rendering, and every reader below runs asynchronously.
  useEffect(() => {
    pathRef.current = pathname;
    routerRef.current = router;
  }, [pathname, router]);

  useEffect(() => {
    let active = true;

    const applySession = (hasUser: boolean) => {
      if (!active) return;
      setIsAuthenticated(hasUser);

      const path = pathRef.current;
      if (!hasUser && path !== '/login') routerRef.current.replace('/login');
      else if (hasUser && path === '/login') routerRef.current.replace('/');
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(!!data.session?.user))
      .catch((err) => {
        console.warn('Auth check error:', err);
        applySession(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(!!session?.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // The login route renders itself; no gate, no splash.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 bg-[#111111] flex flex-col items-center justify-center gap-4 text-white"
      >
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

  return <>{children}</>;
};
