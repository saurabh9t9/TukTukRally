import React from 'react';
import { Smartphone, Share, PlusSquare, Download, CheckCircle2, WifiOff, X } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canNativePrompt: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  onTriggerNativeInstall: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  canNativePrompt,
  isIOS,
  isInstalled,
  onTriggerNativeInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#23170D] border-2 border-[#F59E0B] p-6 text-[#FFFBEB] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[#1C1008]">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 id="pwa-modal-title" className="font-display text-xl font-extrabold tracking-tight text-[#FEF08A]">
                Get Auto Rally on Your Phone
              </h2>
              <p className="text-xs text-[#FDE68A]/80">
                100% Offline Ready · Play on trains with zero network
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install guide"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#342214] text-[#FDE68A] hover:bg-[#462E1B] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isInstalled ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#14532D]/60 border border-[#22C55E]/50 p-4 text-sm text-[#DCFCE7]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ADE80]" />
            <span>Auto Rally is already installed on your home screen and ready for offline play!</span>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {canNativePrompt && (
              <div className="rounded-xl bg-[#342214] p-4 border border-[#F59E0B]/40">
                <p className="text-xs font-semibold text-[#FDE68A] mb-2.5">
                  Instant One-Tap Install (Android / Chrome)
                </p>
                <button
                  type="button"
                  onClick={onTriggerNativeInstall}
                  className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2.5 font-display text-sm font-extrabold text-[#052E16] hover:bg-[#4ADE80] transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Install App Now
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* iPhone / iOS Safari Instructions */}
              <div
                className={`rounded-xl p-3.5 border ${
                  isIOS
                    ? 'bg-[#342214] border-[#F59E0B]'
                    : 'bg-[#1A1109] border-[#462E1B]'
                }`}
              >
                <div className="font-display text-sm font-bold text-[#FEF08A]">
                  iPhone & iPad (Safari)
                </div>
                <ol className="mt-2 space-y-2 text-xs text-[#FFFBEB]/90">
                  <li className="flex items-start gap-2">
                    <Share className="h-4 w-4 shrink-0 text-[#38BDF8] mt-0.5" />
                    <span>
                      1. Tap the <strong>Share</strong> icon in Safari&apos;s bottom bar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="h-4 w-4 shrink-0 text-[#FACC15] mt-0.5" />
                    <span>
                      2. Scroll and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android Chrome Instructions */}
              <div className="rounded-xl bg-[#1A1109] border border-[#462E1B] p-3.5">
                <div className="font-display text-sm font-bold text-[#4ADE80]">
                  Android (Chrome)
                </div>
                <ol className="mt-2 space-y-2 text-xs text-[#FFFBEB]/90">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 shrink-0 text-[#4ADE80] mt-0.5" />
                    <span>
                      1. Tap the <strong>⋮ Menu</strong> in the top-right corner of Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone className="h-4 w-4 shrink-0 text-[#FACC15] mt-0.5" />
                    <span>
                      2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-[#1A1109] px-3.5 py-2.5 text-xs text-[#FDE68A]/90 border border-[#462E1B]">
              <WifiOff className="h-4 w-4 shrink-0 text-[#F59E0B]" />
              <span>
                Once added to your home screen, the entire track, sound synth, and saved leaderboard run with zero internet connection.
              </span>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-[#F59E0B] px-5 py-2 font-display text-sm font-extrabold text-[#1C1008] hover:bg-[#FACC15] transition-colors cursor-pointer"
          >
            Got It, Let&apos;s Race
          </button>
        </div>
      </div>
    </div>
  );
};
