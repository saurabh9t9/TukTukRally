import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Video,
  Settings,
} from 'lucide-react';
import { formatRaceTime, PowerUpType, TOTAL_LAPS } from '../game/rules';
import { getActiveTrack } from '../game/track';
import { CameraMode } from '../game/renderer';

export interface HudSnapshot {
  currentLap: number;
  coinsCollected: number;
  pocketChaiMeter: number;
  activePowerUp: PowerUpType | null;
  hasShield: boolean;
  statusBannerText: string | null;
  statusBannerColor: string;
}

interface PlayingHUDProps {
  hud: HudSnapshot;
  bestTimeMs: number | null;
  currentRacer: string;
  isMuted: boolean;
  cameraMode: CameraMode;
  onCycleCameraMode: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onRestart: () => void;
  timerTextRef: React.RefObject<HTMLDivElement | null>;
  speedTextRef: React.RefObject<HTMLSpanElement | null>;
  minimapDotRef: React.RefObject<SVGCircleElement | null>;
  onTouchControlChange: (
    control: 'accelerate' | 'brake' | 'left' | 'right',
    pressed: boolean
  ) => void;
  onTouchHorn: () => void;
}

export const PlayingHUD: React.FC<PlayingHUDProps> = ({
  hud,
  bestTimeMs,
  currentRacer,
  isMuted,
  cameraMode,
  onCycleCameraMode,
  onToggleMute,
  onOpenSettings,
  onPause,
  onRestart,
  timerTextRef,
  speedTextRef,
  minimapDotRef,
  onTouchControlChange,
  onTouchHorn,
}) => {
  const activeTrack = getActiveTrack();
  const startPt = activeTrack.samples[0];
  const powerUpLabel =
    hud.activePowerUp === 'chai_nitro'
      ? 'CHAI NITRO!'
      : hud.activePowerUp === 'magnet'
      ? 'COIN MAGNET!'
      : hud.hasShield
      ? 'NIMBU SHIELD'
      : null;

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-1.5 sm:p-3.5 pointer-events-none overflow-hidden">
      {/* Top Perimeter Row: Left Telemetry Cluster + Right Minimap & Utilities */}
      <div className="flex items-start justify-between gap-1 sm:gap-2 shrink-0">
        {/* Top-Left Cluster: Lap, Live Race Timer, Coins & Chai Meter */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-3 rounded-xl bg-[#1C1008]/90 border-2 border-[#F59E0B] px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg w-fit">
            {/* LAP Counter */}
            <div>
              <div className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#FDE68A] truncate max-w-[64px] sm:max-w-none leading-none">
                LAP ({currentRacer})
              </div>
              <div
                className="font-display text-sm sm:text-xl font-black text-[#FEF08A] font-mono-tabular leading-tight"
                data-testid="hud-lap"
              >
                {hud.currentLap}/{TOTAL_LAPS}
              </div>
            </div>

            <div className="h-5 sm:h-6 w-[1px] bg-[#F59E0B]/35" />

            {/* Live 60Hz Race Timer */}
            <div>
              <div className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#FDE68A] leading-none">
                TIME
              </div>
              <div
                ref={timerTextRef}
                data-testid="hud-timer"
                className="font-mono-tabular text-sm sm:text-xl font-extrabold text-[#4ADE80] leading-tight"
              >
                00:00.00
              </div>
            </div>

            <div className="hidden md:block h-6 w-[1px] bg-[#F59E0B]/35" />

            {/* Saved Best Time */}
            <div className="hidden md:block">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FDE68A] leading-none">
                BEST
              </div>
              <div className="font-mono-tabular text-sm font-bold text-[#FEF08A] leading-tight">
                {formatRaceTime(bestTimeMs)}
              </div>
            </div>
          </div>

          {/* Coins & Pocket Chai Turbo Meter Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#1C1008]/90 border border-[#F59E0B]/70 px-2 py-0.5 w-fit shadow-md">
            <div className="flex items-center gap-1" data-testid="hud-coins">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="#FACC15"
                  stroke="#1C1008"
                  strokeWidth="2.5"
                />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="900"
                  fill="#1C1008"
                >
                  ₹
                </text>
              </svg>
              <span className="font-mono-tabular text-xs font-extrabold text-[#FEF08A]">
                {hud.coinsCollected}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-[#F59E0B]/35" />

            {/* 5-Pip Chai Turbo Charge Sockets */}
            <div
              className="flex items-center gap-0.5 sm:gap-1"
              title="Collect 5 coins then honk for Garam Chai Turbo!"
            >
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#FDE68A] mr-0.5">
                CHAI
              </span>
              {[0, 1, 2, 3, 4].map((pip) => {
                const filled = pip < hud.pocketChaiMeter;
                return (
                  <span
                    key={pip}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-xs border border-[#1C1008] transition-colors ${
                      filled ? 'bg-[#F97316]' : 'bg-[#342214]'
                    }`}
                  />
                );
              })}
            </div>

            {powerUpLabel && (
              <>
                <div className="h-3 w-[1px] bg-[#F59E0B]/35" />
                <span className="text-[9px] sm:text-[11px] font-extrabold text-[#4ADE80] tracking-wide whitespace-nowrap">
                  {powerUpLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right Cluster: Utility Icon Buttons + Compact Track Minimap */}
        <div className="flex flex-col sm:flex-row items-end sm:items-start gap-1 sm:gap-1.5 shrink-0">
          {/* Utility Buttons: Camera View [C], Settings [⚙], Mute [M], Pause [P], Restart [R] */}
          <div className="pointer-events-auto flex items-center gap-1">
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Switch 3D camera distance (${cameraMode}) [C]`}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleCameraMode();
              }}
              className="flex h-8 sm:h-9 px-1.5 sm:px-2.5 items-center justify-center gap-1 rounded-lg bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[10px] font-extrabold text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
            >
              <Video className="h-3.5 w-3.5 text-[#F59E0B]" />
              <span className="hidden md:inline uppercase">{cameraMode}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Open Settings and Download App"
              data-testid="hud-settings-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSettings();
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-transform cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FACC15]" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Unmute sound [M]' : 'Mute sound [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-transform cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#EF4444]" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#4ADE80]" />
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause game [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-transform cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart race [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Corner Track Radar Map */}
          <div className="flex items-center justify-center rounded-xl bg-[#1C1008]/90 border-2 border-[#F59E0B] p-1 shadow-lg">
            <svg
              viewBox="-1650 -1050 3300 2100"
              className="w-14 h-9 sm:w-22 sm:h-13 overflow-visible"
              aria-label="Track minimap"
            >
              <polygon
                points={activeTrack.svgMinimapPoints}
                fill="none"
                stroke="#57534E"
                strokeWidth="175"
                strokeLinejoin="round"
              />
              <polygon
                points={activeTrack.svgMinimapPoints}
                fill="none"
                stroke="#FDE68A"
                strokeWidth="34"
                strokeLinejoin="round"
              />
              {/* Start/Finish Line Marker */}
              <line
                x1={startPt.x}
                y1={startPt.y - 115}
                x2={startPt.x}
                y2={startPt.y + 115}
                stroke="#EF4444"
                strokeWidth="75"
              />
              {/* Live Player Dot */}
              <circle
                ref={minimapDotRef}
                cx={startPt.x}
                cy={startPt.y}
                r="130"
                fill="#22C55E"
                stroke="#1C1008"
                strokeWidth="50"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Transient Event Callout Banner (upper-third safe zone) */}
      {hud.statusBannerText && (
        <div className="mx-auto mt-0.5 text-center pointer-events-none">
          <div
            className="font-display text-base sm:text-2xl font-black tracking-wide hud-stroke"
            style={{ color: hud.statusBannerColor }}
          >
            {hud.statusBannerText}
          </div>
        </div>
      )}

      {/* Bottom Ergonomic Thumb-Zone Touch Pedals — Fits 320px+ Portrait & Landscape */}
      <div className="mt-auto flex items-end justify-between gap-1 sm:gap-3 pt-1 shrink-0">
        {/* Left Thumb Zone: Steer Left & Steer Right */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Steer Left"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchControlChange('left', true);
            }}
            onPointerUp={() => onTouchControlChange('left', false)}
            onPointerCancel={() => onTouchControlChange('left', false)}
            onLostPointerCapture={() => onTouchControlChange('left', false)}
            className="flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center rounded-xl bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] active:bg-[#F59E0B] active:text-[#1C1008] shadow-lg cursor-pointer select-none"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 fill-current">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Steer Right"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchControlChange('right', true);
            }}
            onPointerUp={() => onTouchControlChange('right', false)}
            onPointerCancel={() => onTouchControlChange('right', false)}
            onLostPointerCapture={() => onTouchControlChange('right', false)}
            className="flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center rounded-xl bg-[#1C1008]/90 border-2 border-[#F59E0B] text-[#FEF08A] active:bg-[#F59E0B] active:text-[#1C1008] shadow-lg cursor-pointer select-none"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 fill-current">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
        </div>

        {/* Bottom-Baseline Compact Speedometer Pill */}
        <div className="mb-0.5 flex items-baseline gap-0.5 rounded-lg bg-[#1C1008]/90 border border-[#F59E0B]/70 px-1.5 sm:px-2.5 py-0.5 shadow-md shrink-0">
          <span
            ref={speedTextRef}
            className="font-mono-tabular text-xs sm:text-base font-black text-[#FEF08A]"
          >
            0
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold uppercase text-[#FDE68A]">
            KM/H
          </span>
        </div>

        {/* Right Thumb Zone: Horn/Boost, Brake, Gas Pedal */}
        <div className="pointer-events-auto flex items-end gap-1 sm:gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Honk Horn or Trigger Chai Turbo"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchHorn();
            }}
            className={`flex h-11 px-2 sm:h-14 sm:px-3 flex-col items-center justify-center rounded-xl border-2 border-[#1C1008] font-display text-[10px] sm:text-xs font-black shadow-lg active:scale-95 transition-transform cursor-pointer select-none ${
              hud.pocketChaiMeter >= 5
                ? 'bg-[#F97316] text-[#1C1008] animate-bounce'
                : 'bg-[#FACC15] text-[#1C1008]'
            }`}
          >
            <span>{hud.pocketChaiMeter >= 5 ? 'CHAI!' : 'HORN'}</span>
            <span className="text-[8px] font-bold opacity-80">POM!</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Brake or Reverse"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchControlChange('brake', true);
            }}
            onPointerUp={() => onTouchControlChange('brake', false)}
            onPointerCancel={() => onTouchControlChange('brake', false)}
            onLostPointerCapture={() => onTouchControlChange('brake', false)}
            className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-[#991B1B] border-2 border-[#FCA5A5] font-display text-[10px] sm:text-xs font-black text-[#FEF2F2] active:bg-[#EF4444] shadow-lg cursor-pointer select-none"
          >
            BRAKE
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Accelerate Gas Pedal"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchControlChange('accelerate', true);
            }}
            onPointerUp={() => onTouchControlChange('accelerate', false)}
            onPointerCancel={() => onTouchControlChange('accelerate', false)}
            onLostPointerCapture={() => onTouchControlChange('accelerate', false)}
            className="flex h-12 w-14 sm:h-15 sm:w-18 flex-col items-center justify-center rounded-xl bg-[#16A34A] border-2 border-[#86EFAC] font-display text-xs sm:text-sm font-black text-[#052E16] active:bg-[#4ADE80] shadow-lg cursor-pointer select-none"
          >
            <span>GAS</span>
            <span className="text-[8px] sm:text-[9px] font-bold">DRIVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
