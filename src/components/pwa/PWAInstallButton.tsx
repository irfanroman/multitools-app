'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share,
  PlusSquare,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  // If already installed and running as standalone app, don't show the button
  if (isStandalone) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstall}
        type="button"
        title="Install aplikasi ke HP / Komputer kamu"
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full surface-chip surface-chip-btn text-xs font-bold transition-all active:scale-95 group hover:border-[#E4FF6B]/50 ${className}`}
      >
        {installSuccess ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Terpasang</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-[#E4FF6B] group-hover:translate-y-0.5 transition-transform" />
            <span>Install App</span>
          </>
        )}
      </button>

      {/* iOS / Fallback Guide Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#181818] text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#E4FF6B] text-[#111111]">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h3 id="pwa-guide-title" className="text-sm font-extrabold text-white">
                  Install Aplikasi (PWA)
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                aria-label="Tutup panduan install"
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-white/80">
              <p className="text-white/60 leading-relaxed">
                Untuk memasang aplikasi ini di layar utama HP atau desktop kamu:
              </p>

              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-white mb-0.5">Buka Menu Browser / Share</p>
                  <p className="text-[11px] text-white/50">
                    Klik tombol <Share className="w-3.5 h-3.5 text-[#E4FF6B] inline mx-0.5" /> <strong>Share</strong> (di Safari iOS) atau ikon titik tiga di browser Chrome.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-white mb-0.5">Pilih &quot;Tambahkan ke Layar Utama&quot;</p>
                  <p className="text-[11px] text-white/50">
                    Pilih opsi <PlusSquare className="w-3.5 h-3.5 text-[#E4FF6B] inline mx-0.5" /> <strong>Add to Home Screen</strong> atau <strong>Install App</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-white mb-0.5">Selesai!</p>
                  <p className="text-[11px] text-white/50">
                    Aplikasi akan langsung muncul di Home Screen kamu dan dapat dibuka tanpa URL bar browser.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-3 rounded-full bg-[#E4FF6B] text-[#111111] font-black text-xs uppercase tracking-wider hover:bg-[#d2f347] transition-all active:scale-98"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
