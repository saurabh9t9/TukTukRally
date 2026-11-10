import React, { useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function unlockOrientation(): void {
  if (typeof window === 'undefined') return;
  try {
    const scr = window.screen as Screen & {
      orientation?: {
        unlock?: () => void;
      };
      unlockOrientation?: () => boolean;
      mozUnlockOrientation?: () => boolean;
      msUnlockOrientation?: () => boolean;
    };
    if (scr.orientation && typeof scr.orientation.unlock === 'function') {
      scr.orientation.unlock();
    } else if (typeof scr.unlockOrientation === 'function') {
      scr.unlockOrientation();
    }
  } catch {
    // Ignore errors when orientation lock is not active
  }
}

export async function toggleFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };

    const isFullscreen =
      !!document.fullscreenElement || !!doc.webkitFullscreenElement;

    if (isFullscreen) {
      if (typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
      unlockOrientation();
      return false;
    } else {
      if (typeof docEl.requestFullscreen === 'function') {
        await docEl.requestFullscreen();
      } else if (typeof docEl.webkitRequestFullscreen === 'function') {
        await docEl.webkitRequestFullscreen();
      }
      // Explicitly unlock orientation after entering fullscreen so mobile browsers never auto-rotate to landscape
      unlockOrientation();
      return true;
    }
  } catch {
    // Ignore fullscreen errors on browsers that restrict it
  }
  return false;
}

interface MobileOrientationGuardProps {
  isOnline: boolean;
}

export const MobileOrientationGuard: React.FC<MobileOrientationGuardProps> = ({
  isOnline,
}) => {
  useEffect(() => {
    unlockOrientation();
  }, []);

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-badge"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full bg-[#1C1008]/95 border border-[#4ADE80] px-2.5 py-0.5 text-[10px] font-extrabold text-[#4ADE80] shadow-lg pointer-events-none whitespace-nowrap"
    >
      <WifiOff className="h-3 w-3 shrink-0" />
      <span>Offline Mode — Playing from Cache</span>
    </div>
  );
};
