import React from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Home,
  Users,
  Sparkles,
  Settings,
} from 'lucide-react';
import { formatRaceTime, GamePhase, SavedRecords } from '../game/rules';

export interface FinishedRunSummary {
  playerName: string;
  totalTimeMs: number;
  lapSplitsMs: number[];
  coins: number;
  timeBonusMs: number;
  isNewBestTime: boolean;
  isNewBestLap: boolean;
}

interface StatusModalsProps {
  phase: GamePhase;
  currentLap: number;
  elapsedMs: number;
  coinsCollected: number;
  summary: FinishedRunSummary | null;
  records: SavedRecords;
  nextRacer: string;
  onSelectNextRacer: (name: string) => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onOpenSettings: () => void;
}

export const StatusModals: React.FC<StatusModalsProps> = ({
  phase,
  currentLap,
  elapsedMs,
  coinsCollected,
  summary,
  records,
  nextRacer,
  onSelectNextRacer,
  onResume,
  onRestart,
  onReturnToTitle,
  onOpenSettings,
}) => {
  if (phase !== 'paused' && phase !== 'gameover') {
    return null;
  }

  if (phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-2.5 sm:p-4 pointer-events-auto overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="w-full max-w-sm rounded-2xl bg-[#1C1008] border-2 border-[#F59E0B] p-3.5 sm:p-5 text-center shadow-2xl overflow-hidden">
          <h2
            id="pause-modal-title"
            className="font-display text-lg sm:text-2xl font-black tracking-wide text-[#FEF08A]"
          >
            CHAI BREAK (PAUSED)
          </h2>
          <p className="mt-0.5 text-[11px] text-[#FDE68A]/80">
            Take a sip and jump right back onto the F1 Circuit
          </p>

          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-[#2A1B0E] p-2 border border-[#F59E0B]/30">
            <div>
              <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                LAP
              </div>
              <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#FFFBEB]">
                {currentLap}/3
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                TIME
              </div>
              <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#4ADE80]">
                {formatRaceTime(elapsedMs)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                COINS
              </div>
              <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#FACC15]">
                ₹{coinsCollected}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={onResume}
              className="flex w-full min-h-[38px] sm:min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#22C55E] px-4 py-2 font-display text-sm sm:text-base font-black text-[#052E16] hover:bg-[#4ADE80] transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              Resume Race
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex w-full min-h-[36px] sm:min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#F59E0B] px-4 py-1.5 font-display text-xs sm:text-sm font-black text-[#1C1008] hover:bg-[#FACC15] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart 3-Lap Trial
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex min-h-[36px] items-center justify-center gap-1 rounded-xl bg-[#2A1B0E] border border-[#F59E0B]/40 px-2.5 py-1.5 font-display text-xs font-bold text-[#FEF08A] hover:bg-[#342214] transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-[#FACC15]" />
                Settings / App
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="flex min-h-[36px] items-center justify-center gap-1 rounded-xl bg-[#2A1B0E] border border-[#F59E0B]/40 px-2.5 py-1.5 font-display text-xs font-bold text-[#FDE68A] hover:bg-[#342214] transition-colors cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                Title Screen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Victory / 3-Lap Race Complete Modal — Zero Scrollbars, Fits Portrait & Short Landscape
  const finalTime = summary ? summary.totalTimeMs : elapsedMs;
  const splits = summary?.lapSplitsMs ?? [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-2 sm:p-4 pointer-events-auto overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      <div className="w-full max-w-md [@media(orientation:landscape)_and_(max-height:500px)]:max-w-2xl rounded-2xl bg-[#1C1008] border-2 border-[#F59E0B] p-3 sm:p-4 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#F59E0B]">
              3 Laps Complete · {summary?.playerName ?? nextRacer}
            </div>
            <h2
              id="victory-modal-title"
              className="font-display text-lg sm:text-2xl font-black text-[#FEF08A] leading-tight"
            >
              SHABASH! RACE FINISHED
            </h2>
          </div>
          {summary?.isNewBestTime && (
            <div className="flex items-center gap-1 rounded-lg bg-[#22C55E] px-2.5 py-1 text-[10px] font-black text-[#052E16]">
              <Sparkles className="h-3.5 w-3.5" />
              NEW BEST!
            </div>
          )}
        </div>

        <div className="mt-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-12 [@media(orientation:landscape)_and_(max-height:500px)]:gap-2.5 [@media(orientation:landscape)_and_(max-height:500px)]:items-center">
          {/* Left Column: Metrics & Lap Splits */}
          <div className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-6 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#2A1B0E] p-2 border border-[#F59E0B]/40 text-center">
              <div>
                <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                  FINAL TIME
                </div>
                <div
                  className="font-mono-tabular text-sm sm:text-base font-black text-[#4ADE80]"
                  data-testid="victory-final-time"
                >
                  {formatRaceTime(finalTime)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                  SAVED BEST
                </div>
                <div
                  className="font-mono-tabular text-sm sm:text-base font-black text-[#FEF08A]"
                  data-testid="victory-best-time"
                >
                  {formatRaceTime(records.bestTimeMs)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-[#FDE68A]">
                  COINS
                </div>
                <div className="font-mono-tabular text-sm sm:text-base font-black text-[#FACC15]">
                  ₹{summary?.coins ?? coinsCollected}
                </div>
              </div>
            </div>

            {splits.length > 0 && (
              <div className="grid grid-cols-3 gap-1 text-center">
                {splits.map((lapMs, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[#24160B] border border-[#462E1B] px-1.5 py-1"
                  >
                    <div className="text-[9px] font-semibold text-[#FDE68A]/75">
                      Lap {i + 1}
                    </div>
                    <div className="font-mono-tabular text-[11px] font-bold text-[#FFFBEB]">
                      {formatRaceTime(lapMs)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {records.leaderboard.length > 0 && (
              <div className="rounded-xl bg-[#24160B] border border-[#462E1B] p-2">
                <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FEF08A] mb-1">
                  <Trophy className="h-3 w-3 text-[#F59E0B]" />
                  Best Times Per Racer
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {records.leaderboard.slice(0, 4).map((entry, idx) => (
                    <div
                      key={entry.id || `${entry.playerName}-${idx}`}
                      className="flex items-center justify-between rounded bg-[#18120B] px-2 py-1 text-[10px]"
                    >
                      <span className="font-bold text-[#FFFBEB] truncate">
                        <span className="font-mono-tabular text-[#F59E0B] mr-1">
                          #{idx + 1}
                        </span>
                        {entry.playerName}
                      </span>
                      <span className="font-mono-tabular font-extrabold text-[#4ADE80] ml-1">
                        {formatRaceTime(entry.totalTimeMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Next Friend & Action Buttons */}
          <div className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-6 mt-2 [@media(orientation:landscape)_and_(max-height:500px)]:mt-0 space-y-2">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#FDE68A] mb-1">
                <Users className="h-3 w-3 text-[#F59E0B]" />
                Pass Phone to Next Friend:
              </div>
              <div className="flex flex-wrap gap-1">
                {records.recentNames.slice(0, 5).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onSelectNextRacer(name)}
                    className={`min-h-[28px] rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                      name === nextRacer
                        ? 'bg-[#F59E0B] text-[#1C1008]'
                        : 'bg-[#2A1B0E] text-[#FDE68A] hover:bg-[#342214]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="flex-1 min-h-[40px] rounded-xl bg-[#22C55E] hover:bg-[#4ADE80] border-2 border-[#1C1008] px-3 py-2 font-display text-xs sm:text-sm font-black text-[#052E16] shadow-[0_3px_0_#1C1008] transition-all cursor-pointer"
              >
                RACE AGAIN ({nextRacer.toUpperCase()})
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="min-h-[40px] rounded-xl bg-[#2A1B0E] border border-[#F59E0B]/50 px-3 py-2 font-display text-xs font-bold text-[#FDE68A] hover:bg-[#342214] transition-colors cursor-pointer"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
