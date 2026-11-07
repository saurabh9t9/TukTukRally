import React from 'react';
import { Trophy, Play, RotateCcw, Home, Users, Sparkles } from 'lucide-react';
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
}) => {
  if (phase !== 'paused' && phase !== 'gameover') {
    return null;
  }

  if (phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="w-full max-w-sm rounded-3xl bg-[#1C1008] border-2 border-[#F59E0B] p-6 text-center shadow-2xl">
          <h2
            id="pause-modal-title"
            className="font-display text-2xl font-black tracking-wide text-[#FEF08A]"
          >
            CHAI BREAK (PAUSED)
          </h2>
          <p className="mt-1 text-xs text-[#FDE68A]/80">
            Take a sip and jump right back onto the Grand Trunk Circuit
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#2A1B0E] p-3 border border-[#F59E0B]/30">
            <div>
              <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
                LAP
              </div>
              <div className="font-mono-tabular text-lg font-extrabold text-[#FFFBEB]">
                {currentLap}/3
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
                TIME
              </div>
              <div className="font-mono-tabular text-lg font-extrabold text-[#4ADE80]">
                {formatRaceTime(elapsedMs)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
                COINS
              </div>
              <div className="font-mono-tabular text-lg font-extrabold text-[#FACC15]">
                ₹{coinsCollected}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 font-display text-base font-black text-[#052E16] hover:bg-[#4ADE80] transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              Resume Race
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 font-display text-sm font-black text-[#1C1008] hover:bg-[#FACC15] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Restart 3-Lap Trial
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2A1B0E] border border-[#F59E0B]/40 px-5 py-2.5 font-display text-sm font-bold text-[#FDE68A] hover:bg-[#342214] transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Victory / 3-Lap Race Complete Modal
  const finalTime = summary ? summary.totalTimeMs : elapsedMs;
  const splits = summary?.lapSplitsMs ?? [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4 pointer-events-auto overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#1C1008] border-2 border-[#F59E0B] p-5 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B]">
              3 Laps Complete · {summary?.playerName ?? nextRacer}
            </div>
            <h2
              id="victory-modal-title"
              className="font-display text-2xl sm:text-3xl font-black text-[#FEF08A]"
            >
              SHABASH! RACE FINISHED
            </h2>
          </div>
          {summary?.isNewBestTime && (
            <div className="flex items-center gap-1 rounded-xl bg-[#22C55E] px-3 py-1.5 text-xs font-black text-[#052E16]">
              <Sparkles className="h-4 w-4" />
              NEW BEST!
            </div>
          )}
        </div>

        {/* Mastery Metrics: Final Time, Saved Best Time, Coins Bonus */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl bg-[#2A1B0E] p-3.5 border border-[#F59E0B]/40">
          <div>
            <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
              FINAL TIME
            </div>
            <div
              className="font-mono-tabular text-lg sm:text-xl font-black text-[#4ADE80]"
              data-testid="victory-final-time"
            >
              {formatRaceTime(finalTime)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
              SAVED BEST
            </div>
            <div
              className="font-mono-tabular text-lg sm:text-xl font-black text-[#FEF08A]"
              data-testid="victory-best-time"
            >
              {formatRaceTime(records.bestTimeMs)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[#FDE68A]">
              COINS BONUS
            </div>
            <div className="font-mono-tabular text-lg sm:text-xl font-black text-[#FACC15]">
              ₹{summary?.coins ?? coinsCollected}
            </div>
          </div>
        </div>

        {/* Individual Lap Splits */}
        {splits.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {splits.map((lapMs, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#24160B] border border-[#462E1B] px-2.5 py-2"
              >
                <div className="text-[10px] font-semibold text-[#FDE68A]/75">
                  Lap {i + 1}
                </div>
                <div className="font-mono-tabular text-xs font-bold text-[#FFFBEB]">
                  {formatRaceTime(lapMs)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pass-the-Phone Leaderboard */}
        {records.leaderboard.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#24160B] border border-[#462E1B] p-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FEF08A] mb-2">
              <Trophy className="h-3.5 w-3.5 text-[#F59E0B]" />
              Pass-the-Phone Best Times
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {records.leaderboard.slice(0, 4).map((entry, idx) => (
                <div
                  key={entry.id || `${entry.playerName}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-[#18120B] px-2.5 py-1.5 text-xs"
                >
                  <span className="font-bold text-[#FFFBEB]">
                    <span className="font-mono-tabular text-[#F59E0B] mr-2">
                      #{idx + 1}
                    </span>
                    {entry.playerName}
                  </span>
                  <span className="font-mono-tabular font-extrabold text-[#4ADE80]">
                    {formatRaceTime(entry.totalTimeMs)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pass Phone to Next Friend Selector */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FDE68A] mb-2">
            <Users className="h-3.5 w-3.5 text-[#F59E0B]" />
            Pass Phone to Next Friend:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {records.recentNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSelectNextRacer(name)}
                className={`min-h-[36px] rounded-xl px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
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

        {/* Primary Play Again & Title CTAs */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 min-h-[50px] rounded-2xl bg-[#22C55E] hover:bg-[#4ADE80] border-2 border-[#1C1008] px-5 py-3 font-display text-base font-black text-[#052E16] shadow-[0_4px_0_#1C1008] transition-all cursor-pointer"
          >
            RACE AGAIN ({nextRacer.toUpperCase()})
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="min-h-[50px] rounded-2xl bg-[#2A1B0E] border border-[#F59E0B]/50 px-4 py-3 font-display text-sm font-bold text-[#FDE68A] hover:bg-[#342214] transition-colors cursor-pointer"
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
};
