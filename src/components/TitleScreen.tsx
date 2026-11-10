import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Trophy,
  Users,
  Plus,
  Flag,
  Settings,
} from 'lucide-react';
import { formatRaceTime, SavedRecords } from '../game/rules';
import { TRACK_MAPS, TrackMapId } from '../game/track';

interface TitleScreenProps {
  records: SavedRecords;
  currentRacer: string;
  selectedTrackId: TrackMapId;
  onSelectTrack: (trackId: TrackMapId) => void;
  onSelectRacer: (name: string) => void;
  onStartRace: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  records,
  currentRacer,
  selectedTrackId,
  onSelectTrack,
  onSelectRacer,
  onStartRace,
  isMuted,
  onToggleMute,
  onOpenSettings,
}) => {
  const [customName, setCustomName] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim().slice(0, 14);
    if (trimmed) {
      onSelectRacer(trimmed);
      setCustomName('');
      setIsAddingFriend(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-2 sm:p-4 pointer-events-none overflow-hidden">
      {/* Top Bar: Saved Best Time Plaque + Settings & Mute Utilities */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#1C1008]/92 border-2 border-[#F59E0B] px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg"
          data-testid="title-best-time"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B] text-[#1C1008]">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[10px] font-bold tracking-wider uppercase text-[#FDE68A] leading-none">
              Saved Best (3 Laps)
            </div>
            <div className="font-mono-tabular text-xs sm:text-base font-extrabold text-[#FEF08A] leading-tight">
              {formatRaceTime(records.bestTimeMs)}
            </div>
          </div>
        </div>

        {/* Right Utility Controls: Settings (with iOS & Android Download) + Sound Mute */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open Settings and Download App"
            data-testid="open-settings-btn"
            className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1C1008]/92 border-2 border-[#F59E0B] px-2.5 sm:px-3 text-xs font-extrabold text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <Settings className="h-4 w-4 text-[#FACC15]" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#1C1008]/92 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#EF4444]" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#4ADE80]" />
            )}
          </button>
        </div>
      </div>

      {/* Center Single Fixed-Fit Stage Card — Guaranteed Zero Overflow on Small Portrait & Landscape Phones */}
      <div className="my-auto flex items-center justify-center w-full min-h-0">
        <div className="pointer-events-auto w-full max-w-md [@media(orientation:landscape)_and_(max-height:500px)]:max-w-2xl rounded-2xl bg-[#1C1008]/94 border-2 border-[#F59E0B] p-2.5 sm:p-4 [@media(orientation:landscape)_and_(max-height:500px)]:p-2.5 shadow-2xl overflow-hidden">
          <div className="[@media(orientation:landscape)_and_(max-height:500px)]:grid [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-12 [@media(orientation:landscape)_and_(max-height:500px)]:gap-2.5 [@media(orientation:landscape)_and_(max-height:500px)]:items-center">
            {/* Left / Top Column: Compact Emblem + Racer Selector + Inline Leaderboard Strip */}
            <div className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-5 flex flex-col gap-1.5">
              {/* Compact Inline SVG Emblem */}
              <div className="w-full flex justify-center">
                <svg
                  viewBox="0 0 460 96"
                  className="w-full max-w-[260px] sm:max-w-[320px] max-h-[46px] sm:max-h-[62px] [@media(orientation:landscape)_and_(max-height:500px)]:max-h-[42px] h-auto"
                  role="img"
                  aria-label="Auto Rally — F1 Grand Prix Time Trial"
                >
                  <defs>
                    <linearGradient
                      id="plaqueGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#9A3412" />
                      <stop offset="50%" stopColor="#B45309" />
                      <stop offset="100%" stopColor="#9A3412" />
                    </linearGradient>
                    <linearGradient
                      id="titleGold"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="60%" stopColor="#FACC15" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                  </defs>

                  <rect
                    x="6"
                    y="6"
                    width="448"
                    height="84"
                    rx="18"
                    fill="url(#plaqueGrad)"
                    stroke="#FACC15"
                    strokeWidth="4"
                  />

                  <g transform="translate(24, 16) scale(0.66)">
                    <path
                      d="M12 42 C12 12, 34 4, 68 4 C86 4, 96 18, 100 42 Z"
                      fill="#FACC15"
                      stroke="#1C1008"
                      strokeWidth="5"
                    />
                    <path
                      d="M72 12 L92 12 L98 38 L72 38 Z"
                      fill="#38BDF8"
                      stroke="#1C1008"
                      strokeWidth="4"
                    />
                    <path
                      d="M8 42 L104 42 L108 68 L8 68 Z"
                      fill="#16A34A"
                      stroke="#1C1008"
                      strokeWidth="5"
                    />
                    <circle
                      cx="28"
                      cy="74"
                      r="14"
                      fill="#18181B"
                      stroke="#1C1008"
                      strokeWidth="4"
                    />
                    <circle cx="28" cy="74" r="6" fill="#FACC15" />
                    <circle
                      cx="94"
                      cy="74"
                      r="14"
                      fill="#18181B"
                      stroke="#1C1008"
                      strokeWidth="4"
                    />
                    <circle cx="94" cy="74" r="6" fill="#FACC15" />
                  </g>

                  <text
                    x="275"
                    y="52"
                    textAnchor="middle"
                    fontFamily="Outfit, sans-serif"
                    fontWeight="900"
                    fontSize="40"
                    letterSpacing="1.5"
                    fill="url(#titleGold)"
                    stroke="#1C1008"
                    strokeWidth="6"
                    paintOrder="stroke fill"
                  >
                    AUTO RALLY
                  </text>

                  <text
                    x="275"
                    y="76"
                    textAnchor="middle"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    fontSize="11"
                    letterSpacing="2"
                    fill="#FEF08A"
                  >
                    F1 CIRCUIT PASS-THE-PHONE GP
                  </text>
                </svg>
              </div>

              {/* Pass-the-Phone Friend Selector */}
              <div className="rounded-xl bg-[#2A1B0E] border border-[#F59E0B]/40 p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#FDE68A]">
                    <Users className="h-3 w-3 text-[#F59E0B]" />
                    Driver:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingFriend(!isAddingFriend)}
                    className="flex items-center gap-0.5 text-[10px] sm:text-xs font-bold text-[#4ADE80] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    {isAddingFriend ? 'Cancel' : 'Add Friend'}
                  </button>
                </div>

                {isAddingFriend ? (
                  <form onSubmit={handleAddFriend} className="flex gap-1">
                    <label htmlFor="racer-name-input" className="sr-only">
                      Friend Name
                    </label>
                    <input
                      id="racer-name-input"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Friend's name..."
                      maxLength={14}
                      className="flex-1 min-w-0 rounded-lg bg-[#18120B] border border-[#F59E0B] px-2 py-1 text-xs text-[#FFFBEB] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-[#F59E0B] px-2.5 py-1 text-xs font-extrabold text-[#1C1008] cursor-pointer"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {records.recentNames.slice(0, 5).map((name) => {
                      const active = name === currentRacer;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => onSelectRacer(name)}
                          className={`min-h-[26px] rounded-lg px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#F59E0B] text-[#1C1008]'
                              : 'bg-[#18120B] text-[#FDE68A] hover:bg-[#342214]'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compact Inline Personal Best Strip (Never adds vertical overflow) */}
              {records.leaderboard.length > 0 && (
                <div className="flex items-center justify-between gap-1.5 rounded-xl bg-[#24160B] border border-[#F59E0B]/40 px-2.5 py-1 text-[10px]">
                  <span className="font-extrabold uppercase text-[#FACC15] shrink-0">
                    Top Bests:
                  </span>
                  <div className="flex items-center gap-2 truncate">
                    {records.leaderboard.slice(0, 2).map((entry, idx) => (
                      <span
                        key={entry.id || `${entry.playerName}-${idx}`}
                        className="truncate text-[#FFFBEB] font-semibold"
                      >
                        <strong className="text-[#F59E0B]">#{idx + 1}</strong>{' '}
                        {entry.playerName}{' '}
                        <span className="font-mono-tabular text-[#4ADE80]">
                          {formatRaceTime(entry.totalTimeMs)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right / Bottom Column: F1 Circuit Map Selector + Start Button */}
            <div className="[@media(orientation:landscape)_and_(max-height:500px)]:col-span-7 mt-1.5 [@media(orientation:landscape)_and_(max-height:500px)]:mt-0">
              <div className="mb-1.5">
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#FDE68A]">
                    <Flag className="h-3 w-3 text-[#F59E0B]" />
                    F1 Circuit Map
                  </span>
                  <span className="text-[10px] font-semibold text-[#4ADE80] truncate max-w-[140px]">
                    {TRACK_MAPS.find((m) => m.id === selectedTrackId)?.location}
                  </span>
                </div>

                <div
                  className="grid grid-cols-3 gap-1.5"
                  data-testid="map-selector-grid"
                >
                  {TRACK_MAPS.map((track) => {
                    const isSelected = track.id === selectedTrackId;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        data-testid={`select-map-${track.id}`}
                        onClick={() => onSelectTrack(track.id)}
                        className={`flex flex-col items-center rounded-xl border-2 p-1.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#342214] border-[#FACC15]'
                            : 'bg-[#24160B] border-[#462E1B] hover:border-[#F59E0B]/60'
                        }`}
                      >
                        <svg
                          viewBox="-1650 -1050 3300 2100"
                          className="w-full h-7 sm:h-9 [@media(max-height:480px)]:h-7 mb-0.5 overflow-visible"
                          aria-hidden="true"
                        >
                          <polygon
                            points={track.svgMinimapPoints}
                            fill="none"
                            stroke={isSelected ? '#FACC15' : '#A8A29E'}
                            strokeWidth="160"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx={track.samples[0].x}
                            cy={track.samples[0].y}
                            r="190"
                            fill="#EF4444"
                          />
                        </svg>
                        <div className="w-full truncate font-display text-[10px] sm:text-xs font-extrabold text-[#FFFBEB]">
                          {track.name.replace(' International', '')}
                        </div>
                        <div className="w-full flex items-center justify-between text-[9px] text-[#FDE68A]/80">
                          <span>{track.corners}T</span>
                          <span className="font-bold text-[#F59E0B]">
                            {track.difficulty.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Start CTA */}
              <button
                type="button"
                data-start="true"
                data-testid="start-race-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartRace();
                }}
                className="w-full min-h-[40px] sm:min-h-[46px] rounded-xl bg-[#22C55E] hover:bg-[#4ADE80] active:scale-[0.99] border-2 border-[#1C1008] px-4 py-1.5 sm:py-2 font-display text-sm sm:text-lg font-black tracking-wide text-[#052E16] shadow-[0_3px_0_#1C1008] transition-all cursor-pointer"
              >
                START 3-LAP GP ({currentRacer.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Single-Line Footer Hint */}
      <div className="shrink-0 text-center text-[10px] sm:text-xs font-semibold text-[#FEF08A] hud-stroke-sm truncate">
        Touch Pedals or WASD/Arrows · Settings (⚙) to Download App
      </div>
    </div>
  );
};
