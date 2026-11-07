import React, { useEffect, useState } from 'react';
import {
  Maximize2,
  RotateCcw,
  Share,
  PlusSquare,
  Download,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';

export async function tryEnterFullscreenAndLandscape(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const isFullscreen =
      !!document.fullscreenElement ||
      !!(document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement;

    if (!isFullscreen) {
      if (typeof docEl.requestFullscreen === 'function') {
        await docEl.requestFullscreen();
      } else if (typeof docEl.webkitRequestFullscreen === 'function') {
        await docEl.webkitRequestFullscreen();
      }
    }
  } catch {
    // Ignore fullscreen errors on browsers that restrict it
  }

  try {
    const scr = window.screen as Screen & {
      orientation?: {
        lock?: (orientation: string) => Promise<void>;
      };
    };
    if (scr.orientation && typeof scr.orientation.lock === 'function') {
      await scr.orientation.lock('landscape');
    }
  } catch {
    // Ignore orientation lock errors on iOS Safari where physical rotation is required
  }
}

interface MobileOrientationGuardProps {
  isIOS: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  canNativePrompt: boolean;
  onTriggerNativeInstall: () => void;
}

export const MobileOrientationGuard: React.FC<MobileOrientationGuardProps> = ({
  isIOS,
  isInstalled,
  isOnline,
  canNativePrompt,
  onTriggerNativeInstall,
}) => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [dismissedPortrait, setDismissedPortrait] = useState<boolean>(false);
  const [dismissedIOSBanner, setDismissedIOSBanner] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const portrait = h > w && w < 900;
      setIsPortraitMobile(portrait);
      // Reset manual dismiss if user rotates to landscape and back
      if (!portrait) {
        setDismissedPortrait(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Automatically request fullscreen & landscape on the first touch gesture on phones
    const onFirstMobileTouch = () => {
      if (window.innerWidth < 960) {
        void tryEnterFullscreenAndLandscape();
      }
    };
    window.addEventListener('touchend', onFirstMobileTouch, {
      once: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('touchend', onFirstMobileTouch);
    };
  }, []);

  return (
    <>
      {/* Non-Intrusive Offline Status Indicator */}
      {!isOnline && (
        <div
          data-testid="offline-badge"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#1C1008]/95 border border-[#4ADE80] px-3.5 py-1 text-xs font-extrabold text-[#4ADE80] shadow-lg pointer-events-none"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline Mode — Playing from Device Cache</span>
        </div>
      )}

      {/* Compact iPhone / iOS Safari Offline Install Banner (when in Landscape & not yet installed) */}
      {!isPortraitMobile &&
        !isInstalled &&
        (isIOS || canNativePrompt) &&
        !dismissedIOSBanner && (
          <div
            data-testid="ios-offline-install-banner"
            className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-[#1C1008]/95 border border-[#F59E0B] px-3.5 py-2 text-xs text-[#FFFBEB] shadow-xl pointer-events-auto max-w-lg w-[92vw]"
          >
            {canNativePrompt ? (
              <>
                <Download className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                <span className="flex-1 font-semibold">
                  Install <strong>Auto Rally</strong> for 100% offline fullscreen play
                </span>
                <button
                  type="button"
                  onClick={onTriggerNativeInstall}
                  className="rounded-xl bg-[#22C55E] px-3 py-1.5 font-display text-xs font-black text-[#052E16] cursor-pointer"
                >
                  Install
                </button>
              </>
            ) : (
              <>
                <Share className="h-4 w-4 shrink-0 text-[#38BDF8]" />
                <span className="flex-1 leading-snug">
                  <strong>Install on iPhone (Offline):</strong> Tap Safari{' '}
                  <strong>Share</strong> then <strong>Add to Home Screen</strong>
                </span>
              </>
            )}
            <button
              type="button"
              onClick={() => setDismissedIOSBanner(true)}
              aria-label="Dismiss install hint"
              className="text-[#FDE68A]/70 hover:text-[#FEF08A] font-bold px-1.5 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

      {/* Fullscreen Rotate-Device Prompt when Opened on Phone in Portrait Orientation */}
      {isPortraitMobile && !dismissedPortrait && (
        <div
          data-testid="rotate-device-overlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#120B06]/96 p-5 text-center text-[#FFFBEB] pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-phone-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#1C1008] border-2 border-[#F59E0B] p-6 shadow-2xl">
            {/* Animated Rotating Phone Illustration */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2A1B0E] border border-[#F59E0B]/50">
              <div className="relative flex items-center justify-center animate-pulse">
                <svg
                  viewBox="0 0 64 64"
                  className="h-14 w-14 text-[#FACC15]"
                  fill="none"
                >
                  {/* Vertical phone outline rotating to horizontal */}
                  <rect
                    x="10"
                    y="18"
                    width="44"
                    height="28"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="#18120B"
                  />
                  <circle cx="48" cy="32" r="2" fill="#F59E0B" />
                  <path
                    d="M18 36 C24 26, 32 26, 40 36"
                    stroke="#4ADE80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <RotateCcw className="absolute -top-1 -right-1 h-5 w-5 text-[#4ADE80]" />
              </div>
            </div>

            <h2
              id="rotate-phone-title"
              className="font-display text-xl font-black tracking-wide text-[#FEF08A]"
            >
              ROTATE PHONE TO LANDSCAPE
            </h2>
            <p className="mt-1.5 text-xs text-[#FDE68A]/85 leading-relaxed">
              Auto Rally is designed for widescreen Formula 1 racing. Rotate
              your phone sideways and tap below for automatic fullscreen!
            </p>

            {/* Primary Fullscreen + Landscape Lock Action */}
            <button
              type="button"
              data-testid="enter-fullscreen-btn"
              onClick={async () => {
                await tryEnterFullscreenAndLandscape();
                setDismissedPortrait(true);
              }}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#22C55E] hover:bg-[#4ADE80] border-2 border-[#1C1008] px-5 py-3 font-display text-sm font-black text-[#052E16] shadow-[0_4px_0_#1C1008] active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" />
              ENTER FULLSCREEN &amp; RACE
            </button>

            {/* iPhone / Android Offline Home Screen Install Card */}
            <div className="mt-4 rounded-2xl bg-[#24160B] border border-[#F59E0B]/40 p-3.5 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-xs font-extrabold uppercase tracking-wider text-[#FEF08A]">
                  Install for Offline Play (iPhone &amp; Android)
                </span>
                {isInstalled && (
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                )}
              </div>

              {isInstalled ? (
                <p className="text-[11px] text-[#4ADE80] font-semibold">
                  Installed on Home Screen — 100% ready for offline play!
                </p>
              ) : canNativePrompt ? (
                <button
                  type="button"
                  onClick={onTriggerNativeInstall}
                  className="mt-1 flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-3 py-2 font-display text-xs font-black text-[#1C1008] cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Install Offline App Now
                </button>
              ) : (
                <div className="space-y-1.5 text-[11px] text-[#FFFBEB]/90">
                  <div className="flex items-center gap-2">
                    <Share className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]" />
                    <span>
                      <strong>iPhone (Safari):</strong> Tap{' '}
                      <strong>Share ↑</strong> at the bottom of Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlusSquare className="h-3.5 w-3.5 shrink-0 text-[#FACC15]" />
                    <span>
                      Tap <strong>Add to Home Screen</strong> to play offline
                      without internet
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="dismiss-rotate-btn"
              onClick={() => setDismissedPortrait(true)}
              className="mt-3 text-xs font-bold text-[#FDE68A]/75 hover:text-[#FEF08A] underline cursor-pointer py-1"
            >
              Continue in Portrait Mode
            </button>
          </div>
        </div>
      )}
    </>
  );
};
