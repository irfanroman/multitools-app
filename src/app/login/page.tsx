'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Lock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign in fields
  const [identifier, setIdentifier] = useState(''); // username or email
  
  // Sign up fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Shared password field
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Security: Brute Force Protection (Lockout after 5 failed attempts)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Countdown timer for lockout
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Input Sanitizer helper
  const sanitizeText = (text: string) => {
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

  // Password Requirements Analysis
  const passwordChecks = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const score = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber].filter(Boolean).length;
    
    let strengthLabel = 'Sangat Lemah';
    let strengthColor = 'bg-rose-500';
    let strengthTextColor = 'text-rose-400';

    if (score === 4) {
      strengthLabel = 'Sangat Kuat';
      strengthColor = 'bg-[#E4FF6B]';
      strengthTextColor = 'text-[#E4FF6B]';
    } else if (score === 3) {
      strengthLabel = 'Kuat';
      strengthColor = 'bg-emerald-400';
      strengthTextColor = 'text-emerald-400';
    } else if (score === 2) {
      strengthLabel = 'Sedang';
      strengthColor = 'bg-amber-400';
      strengthTextColor = 'text-amber-400';
    }

    return {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      score,
      strengthLabel,
      strengthColor,
      strengthTextColor,
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber,
    };
  }, [password]);

  // Helper to normalize username or email into valid auth format for Sign In
  const formatAuthEmail = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@dashboard.local`;
  };

  // Form Submit Handler (Sign in / Sign up with Supabase Auth)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (lockoutSeconds > 0) {
      setErrorMessage(`Akun sementara terkunci demi keamanan. Silakan tunggu ${lockoutSeconds} detik.`);
      return;
    }

    // Validation for Sign Up
    if (mode === 'signup') {
      if (!passwordChecks.isValid) {
        setErrorMessage('Password harus memenuhi seluruh syarat keamanan (huruf besar, kecil, angka, min. 8 karakter).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const cleanEmail = sanitizeText(email).toLowerCase();
        const cleanUsername = sanitizeText(username);

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanUsername,
            },
          },
        });

        if (error) throw error;

        // Pastikan langsung tersimpan di public.profiles juga
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            username: cleanUsername,
            full_name: cleanUsername,
          });
        }

        setFailedAttempts(0);
        confetti({ particleCount: 80, spread: 60 });
        setSuccessMessage('Akun berhasil didaftarkan! Mengarahkan ke dashboard...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        const cleanInput = sanitizeText(identifier);
        let targetEmail = cleanInput;

        // Jika input bukan format email (misal: user mengetik username "nouusuki")
        if (!cleanInput.includes('@')) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', cleanInput)
            .maybeSingle();

          if (profileData && profileData.email) {
            targetEmail = profileData.email;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (error) throw error;

        // Reset failed attempts on successful sign-in
        setFailedAttempts(0);
        confetti({ particleCount: 80, spread: 60 });
        setSuccessMessage('Berhasil masuk! Mengarahkan ke dashboard...');
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: any) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);

      if (nextFail >= 5) {
        setLockoutSeconds(30);
        setErrorMessage('Terlalu banyak percobaan login gagal. Form terkunci selama 30 detik demi keamanan.');
      } else {
        const remaining = 5 - nextFail;
        setErrorMessage(`Login gagal. Periksa kembali username/email dan password kamu. (${remaining} percobaan tersisa sebelum lockout)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-[#EDEFEB]">
      {/* Floating Split-Screen Container with 28px rounded border */}
      <div className="max-w-5xl w-full min-h-[640px] rounded-[28px] overflow-hidden bg-[#111111] border border-black/15 shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-400">
        
        {/* KOLOM KIRI: AUTH FORM (±42% width) */}
        <div className="w-full md:w-[48%] lg:w-[44%] bg-[#111111] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative z-10">
          
          {/* Form Content Container */}
          <div>
            {/* Toggle Badge Pill: SIGN IN / SIGN UP */}
            <div className="inline-flex p-1 rounded-full bg-[#1A1A1A] border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${
                  mode === 'signin'
                    ? 'bg-[#E4FF6B] text-[#111111] shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${
                  mode === 'signup'
                    ? 'bg-[#E4FF6B] text-[#111111] shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                SIGN UP
              </button>
            </div>

            {/* Heading & Sub-text */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back!'}
            </h1>
            <p className="text-xs text-white/60 leading-relaxed mb-5 font-normal">
              {mode === 'signup'
                ? 'Lengkapi data akun untuk mulai mengelola keuangan dan studimu.'
                : 'Masuk untuk kelola keuangan, belajar, dan progress kamu di satu tempat.'}
            </p>

            {/* Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-[#E4FF6B]/10 border border-[#E4FF6B]/30 flex items-start gap-2 text-[#E4FF6B] text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' ? (
                /* SIGN UP FORM FIELDS */
                <>
                  {/* Username */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Pilih username unik"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-9 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-white/35 focus:outline-none focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B] transition-all"
                      />
                      <User className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="email@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-9 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-white/35 focus:outline-none focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B] transition-all"
                      />
                      <Mail className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password with Strength Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        Password
                      </label>
                      {password.length > 0 && (
                        <span className={`text-[10px] font-bold ${passwordChecks.strengthTextColor}`}>
                          {passwordChecks.strengthLabel}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Buat kata sandi kuat"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-white/35 focus:outline-none focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B] transition-all"
                      />
                      <Lock className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Password Strength Visual Bar */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in">
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordChecks.score >= step
                                  ? passwordChecks.strengthColor
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Requirements checklist badges */}
                        <div className="grid grid-cols-2 gap-1 pt-1">
                          <div
                            className={`flex items-center gap-1 text-[9px] font-semibold ${
                              passwordChecks.hasMinLength ? 'text-[#E4FF6B]' : 'text-white/40'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                              passwordChecks.hasMinLength ? 'bg-[#E4FF6B] text-black font-bold' : 'bg-white/10'
                            }`}>
                              ✓
                            </span>
                            <span>Min. 8 karakter</span>
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[9px] font-semibold ${
                              passwordChecks.hasUpperCase ? 'text-[#E4FF6B]' : 'text-white/40'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                              passwordChecks.hasUpperCase ? 'bg-[#E4FF6B] text-black font-bold' : 'bg-white/10'
                            }`}>
                              ✓
                            </span>
                            <span>Huruf besar (A-Z)</span>
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[9px] font-semibold ${
                              passwordChecks.hasLowerCase ? 'text-[#E4FF6B]' : 'text-white/40'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                              passwordChecks.hasLowerCase ? 'bg-[#E4FF6B] text-black font-bold' : 'bg-white/10'
                            }`}>
                              ✓
                            </span>
                            <span>Huruf kecil (a-z)</span>
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[9px] font-semibold ${
                              passwordChecks.hasNumber ? 'text-[#E4FF6B]' : 'text-white/40'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                              passwordChecks.hasNumber ? 'bg-[#E4FF6B] text-black font-bold' : 'bg-white/10'
                            }`}>
                              ✓
                            </span>
                            <span>Angka (0-9)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Ulangi kata sandi"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3.5 py-2.5 pl-9 pr-10 rounded-2xl bg-[#1A1A1A] border text-white text-xs placeholder-white/35 focus:outline-none transition-all ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-white/10 focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B]'
                        }`}
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[10px] text-rose-400 mt-1">Konfirmasi password belum cocok</p>
                    )}
                  </div>
                </>
              ) : (
                /* SIGN IN FORM FIELDS */
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                      Username atau Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        disabled={lockoutSeconds > 0 || isLoading}
                        autoComplete="username"
                        spellCheck={false}
                        autoCapitalize="none"
                        placeholder="Username atau email kamu"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-white/35 focus:outline-none focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B] transition-all disabled:opacity-50"
                      />
                      <User className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={lockoutSeconds > 0 || isLoading}
                        autoComplete="current-password"
                        spellCheck={false}
                        placeholder="Masukkan kata sandi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-10 pr-11 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white text-xs placeholder-white/35 focus:outline-none focus:border-[#E4FF6B] focus:ring-1 focus:ring-[#E4FF6B] transition-all disabled:opacity-50"
                      />
                      <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  lockoutSeconds > 0 ||
                  (mode === 'signup' && (!passwordChecks.isValid || password !== confirmPassword))
                }
                className="w-full mt-2 py-3.5 rounded-full bg-[#E4FF6B] text-[#111111] font-black text-xs uppercase tracking-wider hover:bg-[#d2f347] transition-all shadow-md shadow-lime-500/10 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {lockoutSeconds > 0 ? (
                  <span>Terkunci ({lockoutSeconds}s)</span>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Continue' : 'Create Account'}</span>
                )}
              </button>
            </form>
          </div>

          {/* Switch Mode Link & Footer */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-center text-xs text-white/50 mb-3">
              {mode === 'signup' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-extrabold text-[#E4FF6B] hover:underline"
              >
                {mode === 'signup' ? 'Masuk' : 'Daftar Sekarang'}
              </button>
            </p>

            <div className="flex items-center justify-between text-[10px] text-white/40">
              <div className="flex gap-2">
                <span className="hover:text-white cursor-pointer">Privacy</span>
                <span>·</span>
                <span className="hover:text-white cursor-pointer">Terms</span>
              </div>
              <span className="font-semibold text-white/50">multi-tools.app</span>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: SOLID DARK BRANDING PANEL (±56% width) */}
        <div className="w-full md:w-[52%] lg:w-[56%] bg-[#0B0B0B] relative flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden select-none">
          
          {/* Subtle Ambient Radial Lime Glow */}
          <div className="absolute w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(228,255,107,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Subtle Grid Dot Matrix Background Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #E4FF6B 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Decorative Minimalist Shapes */}
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full border border-white/5 pointer-events-none" />

          {/* Center Brand Logo & Tagline */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-4">
            
            {/* Logo rendered in brand lime #E4FF6B with vector SVG */}
            <div className="relative mb-8 group flex items-center justify-center">
              <div className="absolute -inset-4 bg-[#E4FF6B]/15 rounded-full blur-2xl group-hover:bg-[#E4FF6B]/30 transition-all pointer-events-none" />
              
              <Logo
                className="w-24 h-32 sm:w-28 sm:h-38 text-[#E4FF6B] relative z-10 transition-transform duration-500 hover:scale-105 drop-shadow-[0_0_28px_rgba(228,255,107,0.45)]"
                fill="#E4FF6B"
              />
            </div>

            {/* App Title */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
              Multi Tools Suite
            </h2>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-white/70 font-normal leading-relaxed mb-6">
              Your finance, study, and growth — in one dashboard.
            </p>

            {/* Minimalist Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Finance Tracker', 'Study Summarizer', 'ML Playground', 'Mindful Journal'].map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Branding Mark */}
          <div className="absolute bottom-6 text-[10px] font-semibold text-white/30 tracking-widest uppercase">
            Designed for Students
          </div>
        </div>

      </div>
    </div>
  );
}
