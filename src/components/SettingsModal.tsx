import React, { useEffect, useState } from 'react';
import {
  Settings,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Volume2,
  VolumeX,
  Video,
  Maximize2,
  Copy,
  ExternalLink,
  X,
  WifiOff,
} from 'lucide-react';
import { CameraMode } from '../game/renderer';
import { toggleFullscreen } from './MobileOrientationGuard';
import {
  downloadStandaloneOfflineGameFile,
  OfflineCacheStatus,
  warmOfflineCache,
} from '../utils/offlineCacheManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  canNativePrompt: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  onTriggerNativeInstall: () => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  cameraMode,
  onSelectCameraMode,
  canNativePrompt,
  isIOS,
  isInstalled,
  onTriggerNativeInstall,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android'>(
    isIOS ? 'ios' : 'android'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<OfflineCacheStatus>({
    isCaching: false,
    isReady: false,
    cachedCount: 0,
  });
  const [orientationLabel, setOrientationLabel] = useState<
    'Portrait' | 'Landscape'
  >(() =>
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
      ? 'Landscape'
      : 'Portrait'
  );

  useEffect(() => {
    if (isIOS) {
      setSelectedPlatform('ios');
    }
  }, [isIOS]);

  useEffect(() => {
    if (isOpen) {
      void warmOfflineCache(setCacheStatus);
    }
  }, [isOpen]);

  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window === 'undefined') return;
      setOrientationLabel(
        window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape'
      );
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  if (!isOpen) return null;

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://localhost:3000';

  const handleDownloadAction = async () => {
    // 1. Warm offline cache
    const status = await warmOfflineCache(setCacheStatus);

    // 2. Trigger native install prompt if available on Android Chrome / Desktop
    if (canNativePrompt) {
      const accepted = await onTriggerNativeInstall();
      if (accepted) {
        setInstallFeedback(
          `Offline cache saved (${status.cachedCount} files) & app installation started!`
        );
        return;
      }
    }

    // 3. Download self-contained Auto-Rally-Offline.html file so the user can open it from
    // Chrome Downloads (Android) or Files/Safari (iOS) with network 100% OFF!
    downloadStandaloneOfflineGameFile();

    if (isIOS) {
      setSelectedPlatform('ios');
      setInstallFeedback(
        'Downloaded Auto-Rally-Offline.html! Open it from Files/Safari Downloads to play 100% offline.'
      );
    } else {
      setSelectedPlatform('android');
      setInstallFeedback(
        'Downloaded Auto-Rally-Offline.html! Open it in Chrome Downloads to play 100% offline.'
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 pointer-events-auto overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      data-testid="settings-modal"
    >
      <div className="w-full max-w-md [@media(orientation:landscape)_and_(max-height:500px)]:max-w-2xl rounded-2xl bg-[#1C1008] border-2 border-[#F59E0B] p-2.5 sm:p-4 text-[#FFFBEB] shadow-2xl overflow-hidden">
        {/* Compact Modal Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F59E0B]/30">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B] text-[#1C1008]">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-display text-sm sm:text-lg font-black tracking-wide text-[#FEF08A] leading-tight"
              >
                SETTINGS &amp; DOWNLOAD APP
              </h2>
              <p className="text-[10px] text-[#FDE68A]/80 leading-tight">
                {orientationLabel} Mode Active · iOS &amp; Android Offline Ready
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            data-testid="close-settings-btn"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2A1B0E] border border-[#F59E0B]/40 text-[#FEF08A] hover:bg-[#342214] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Adaptive Body: Stacks compactly on Portrait, Side-by-Side 2-Col on Short Landscape — Zero Scrollbars */}
        <div className="mt-2 grid grid-cols-1 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-12 gap-2 items-start">
          {/* Column 1: Download / Install App (iOS & Android) */}
          <div
            className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-7 rounded-xl bg-[#24160B] border border-[#F59E0B]/70 p-2.5"
            data-testid="settings-download-section"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="flex items-center gap-1.5 font-display text-xs font-extrabold uppercase tracking-wider text-[#FEF08A]">
                <Download className="h-3.5 w-3.5 text-[#4ADE80]" />
                Download App (iOS &amp; Android)
              </span>
              {isInstalled ? (
                <span className="flex items-center gap-1 rounded-full bg-[#14532D] px-2 py-0.5 text-[9px] font-bold text-[#4ADE80]">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Installed
                </span>
              ) : cacheStatus.isReady ? (
                <span
                  data-testid="offline-cache-ready-badge"
                  className="flex items-center gap-1 rounded-full bg-[#14532D] px-2 py-0.5 text-[9px] font-bold text-[#4ADE80]"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Cached ({cacheStatus.cachedCount} files)
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-[#342214] px-2 py-0.5 text-[9px] font-bold text-[#FACC15]">
                  <WifiOff className="h-2.5 w-2.5" />
                  {cacheStatus.isCaching ? 'Caching...' : 'Offline Ready'}
                </span>
              )}
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-2 rounded-lg bg-[#14532D]/50 border border-[#22C55E]/50 p-2 text-[11px] text-[#DCFCE7]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                <span>
                  Installed on your device and ready for offline play!
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="settings-download-btn"
                  onClick={() => {
                    void handleDownloadAction();
                  }}
                  className="flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#22C55E] hover:bg-[#4ADE80] active:scale-[0.99] border-2 border-[#1C1008] px-3 py-1.5 font-display text-xs sm:text-sm font-black text-[#052E16] shadow-[0_2px_0_#1C1008] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  {canNativePrompt
                    ? 'DOWNLOAD & INSTALL APP NOW'
                    : 'DOWNLOAD FOR iOS & ANDROID'}
                </button>

                {installFeedback && (
                  <div
                    data-testid="install-feedback-banner"
                    className="mt-1.5 rounded-lg bg-[#14532D]/80 border border-[#4ADE80]/60 px-2.5 py-1 text-[10px] font-semibold text-[#DCFCE7]"
                  >
                    {installFeedback}
                  </div>
                )}

                {/* Platform Switcher Tabs: iOS vs Android */}
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-[#18120B] p-0.5 border border-[#462E1B]">
                  <button
                    type="button"
                    data-testid="tab-ios-download"
                    onClick={() => setSelectedPlatform('ios')}
                    className={`flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${
                      selectedPlatform === 'ios'
                        ? 'bg-[#F59E0B] text-[#1C1008]'
                        : 'text-[#FDE68A]/80 hover:text-[#FEF08A]'
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    iOS (iPhone)
                  </button>
                  <button
                    type="button"
                    data-testid="tab-android-download"
                    onClick={() => setSelectedPlatform('android')}
                    className={`flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${
                      selectedPlatform === 'android'
                        ? 'bg-[#4ADE80] text-[#052E16]'
                        : 'text-[#FDE68A]/80 hover:text-[#FEF08A]'
                    }`}
                  >
                    <Download className="h-3 w-3" />
                    Android
                  </button>
                </div>

                {/* Compact Platform Steps */}
                {selectedPlatform === 'ios' ? (
                  <div
                    data-testid="ios-instructions"
                    className="mt-1.5 rounded-lg bg-[#18120B] border border-[#462E1B] p-2 space-y-1 text-[11px] text-[#FFFBEB]/95 leading-snug"
                  >
                    <div className="flex items-center gap-1.5">
                      <Share className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]" />
                      <span>
                        1. Open in <strong>Safari</strong> &amp; tap{' '}
                        <strong>Share ↑</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PlusSquare className="h-3.5 w-3.5 shrink-0 text-[#FACC15]" />
                      <span>
                        2. Tap <strong>Add to Home Screen</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="android-instructions"
                    className="mt-1.5 rounded-lg bg-[#18120B] border border-[#462E1B] p-2 space-y-1 text-[11px] text-[#FFFBEB]/95 leading-snug"
                  >
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
                      <span>
                        1. Tap <strong>Download</strong> above or Chrome{' '}
                        <strong>⋮ Menu</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 shrink-0 text-[#FACC15]" />
                      <span>
                        2. Tap <strong>Install app</strong> /{' '}
                        <strong>Add to Home screen</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Utility Helpers */}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    data-testid="copy-app-link-btn"
                    onClick={() => {
                      void handleCopyLink();
                    }}
                    className="flex min-h-[30px] items-center justify-center gap-1 rounded-lg bg-[#2A1B0E] border border-[#F59E0B]/40 px-2 py-1 text-[11px] font-bold text-[#FEF08A] hover:bg-[#342214] cursor-pointer"
                  >
                    <Copy className="h-3 w-3 text-[#F59E0B]" />
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>

                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="open-standalone-tab-link"
                    className="flex min-h-[30px] items-center justify-center gap-1 rounded-lg bg-[#2A1B0E] border border-[#F59E0B]/40 px-2 py-1 text-[11px] font-bold text-[#4ADE80] hover:bg-[#342214]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in Tab
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Column 2: Camera View, Sound & Fullscreen */}
          <div className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-5 flex flex-col gap-2">
            {/* 3D Camera Perspective */}
            <div className="rounded-xl bg-[#24160B] border border-[#462E1B] p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FDE68A]">
                  <Video className="h-3 w-3 text-[#F59E0B]" />
                  Camera View
                </span>
                <span className="text-[9px] text-[#FDE68A]/70">Key [C]</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['straight', 'horizon', 'overview'] as CameraMode[]).map(
                  (mode) => {
                    const active = cameraMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onSelectCameraMode(mode)}
                        className={`min-h-[30px] rounded-lg border px-1.5 py-1 text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F59E0B] border-[#FEF08A] text-[#1C1008]'
                            : 'bg-[#18120B] border-[#462E1B] text-[#FDE68A] hover:bg-[#342214]'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Sound & Fullscreen Row */}
            <div className="grid grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="flex min-h-[36px] items-center justify-between rounded-xl bg-[#24160B] border border-[#462E1B] px-2.5 py-1.5 text-left hover:bg-[#2A1B0E] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-[#EF4444]" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-[#4ADE80]" />
                  )}
                  <span className="text-[11px] font-extrabold text-[#FFFBEB]">
                    Sound
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                    isMuted
                      ? 'bg-[#991B1B] text-[#FEF2F2]'
                      : 'bg-[#14532D] text-[#4ADE80]'
                  }`}
                >
                  {isMuted ? 'OFF' : 'ON'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void toggleFullscreen();
                }}
                className="flex min-h-[36px] items-center justify-between rounded-xl bg-[#24160B] border border-[#462E1B] px-2.5 py-1.5 text-left hover:bg-[#2A1B0E] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="h-4 w-4 text-[#FACC15]" />
                  <span className="text-[11px] font-extrabold text-[#FFFBEB]">
                    Fullscreen
                  </span>
                </div>
                <span className="rounded bg-[#342214] border border-[#F59E0B]/40 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#FEF08A]">
                  Toggle
                </span>
              </button>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[34px] rounded-xl bg-[#F59E0B] hover:bg-[#FACC15] py-1.5 font-display text-xs font-black text-[#1C1008] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
