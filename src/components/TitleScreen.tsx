import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Trophy,
  Users,
  Plus,
  Flag,
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
  onOpenInstallModal?: () => void;
  isOffline?: boolean;
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
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 pointer-events-none overflow-y-auto">
      {/* Top Bar: Saved Best Time Plaque + Utility Actions */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#1C1008]/92 border-2 border-[#F59E0B] px-3.5 py-2 shadow-xl"
          data-testid="title-best-time"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[#1C1008]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#FDE68A]">
              Saved Best Time (3 Laps)
            </div>
            <div className="font-mono-tabular text-lg sm:text-xl font-extrabold text-[#FEF08A]">
              {formatRaceTime(records.bestTimeMs)}
            </div>
          </div>
        </div>

        {/* Right Utility Control: Sound Mute */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1C1008]/92 border-2 border-[#F59E0B] text-[#FEF08A] hover:bg-[#342214] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-[#EF4444]" />
            ) : (
              <Volume2 className="h-5 w-5 text-[#4ADE80]" />
            )}
          </button>
        </div>
      </div>

      {/* Center / Left Asymmetric Stage Lockup */}
      <div className="my-auto flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 max-w-6xl w-full mx-auto py-2">
        {/* Main Start & F1 Circuit Selector Card */}
        <div className="pointer-events-auto w-full max-w-xl rounded-3xl bg-[#1C1008]/94 border-2 border-[#F59E0B] p-4 sm:p-5 shadow-2xl">
          {/* Custom Inline SVG Emblem */}
          <div className="w-full flex justify-center mb-2.5">
            <svg
              viewBox="0 0 460 110"
              className="w-full max-w-[380px] h-auto overflow-visible"
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
                x="8"
                y="8"
                width="444"
                height="94"
                rx="22"
                fill="url(#plaqueGrad)"
                stroke="#FACC15"
                strokeWidth="4"
              />
              <rect
                x="16"
                y="15"
                width="428"
                height="80"
                rx="16"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="1.5"
                strokeDasharray="10 6"
              />

              <g transform="translate(30, 22) scale(0.72)">
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
                x="268"
                y="60"
                textAnchor="middle"
                fontFamily="Outfit, sans-serif"
                fontWeight="900"
                fontSize="42"
                letterSpacing="1.5"
                fill="url(#titleGold)"
                stroke="#1C1008"
                strokeWidth="7"
                paintOrder="stroke fill"
              >
                AUTO RALLY
              </text>

              <text
                x="268"
                y="86"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="12"
                letterSpacing="3.2"
                fill="#FEF08A"
              >
                F1 CIRCUIT PASS-THE-PHONE TIME TRIAL
              </text>
            </svg>
          </div>

          {/* F1 Racing Circuit Map Selector (3 Distinct F1 Tracks) */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FDE68A]">
                <Flag className="h-3.5 w-3.5 text-[#F59E0B]" />
                Select F1 Racing Circuit Map
              </span>
              <span className="text-[11px] font-semibold text-[#4ADE80]">
                {TRACK_MAPS.find((m) => m.id === selectedTrackId)?.location}
              </span>
            </div>

            <div
              className="grid grid-cols-3 gap-2"
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
                    className={`flex flex-col items-center rounded-2xl border-2 p-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#342214] border-[#FACC15] shadow-[0_0_0_2px_rgba(250,204,21,0.3)]'
                        : 'bg-[#24160B] border-[#462E1B] hover:border-[#F59E0B]/60'
                    }`}
                  >
                    <svg
                      viewBox="-1650 -1050 3300 2100"
                      className="w-full h-11 sm:h-12 mb-1 overflow-visible"
                      aria-hidden="true"
                    >
                      <polygon
                        points={track.svgMinimapPoints}
                        fill="none"
                        stroke={isSelected ? '#FACC15' : '#A8A29E'}
                        strokeWidth="150"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={track.samples[0].x}
                        cy={track.samples[0].y}
                        r="180"
                        fill="#EF4444"
                      />
                    </svg>
                    <div className="w-full truncate font-display text-xs font-extrabold text-[#FFFBEB]">
                      {track.name.replace(' International', '')}
                    </div>
                    <div className="w-full flex items-center justify-between text-[10px] text-[#FDE68A]/80 mt-0.5">
                      <span>{track.corners} Turns</span>
                      <span className="font-bold text-[#F59E0B]">
                        {track.difficulty.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pass-the-Phone Friend Selector */}
          <div className="rounded-2xl bg-[#2A1B0E] border border-[#F59E0B]/40 p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#FDE68A]">
                <Users className="h-3.5 w-3.5 text-[#F59E0B]" />
                Who&apos;s Driving This Turn?
              </span>
              <button
                type="button"
                onClick={() => setIsAddingFriend(!isAddingFriend)}
                className="flex items-center gap-1 text-xs font-bold text-[#4ADE80] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Friend
              </button>
            </div>

            {isAddingFriend ? (
              <form onSubmit={handleAddFriend} className="flex gap-2 mb-2">
                <label htmlFor="racer-name-input" className="sr-only">
                  Friend Name
                </label>
                <input
                  id="racer-name-input"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter friend's name..."
                  maxLength={14}
                  className="flex-1 rounded-xl bg-[#18120B] border border-[#F59E0B] px-3 py-1.5 text-sm text-[#FFFBEB] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#F59E0B] px-4 py-1.5 text-xs font-extrabold text-[#1C1008] cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              {records.recentNames.map((name) => {
                const active = name === currentRacer;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onSelectRacer(name)}
                    className={`min-h-[34px] rounded-xl px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F59E0B] text-[#1C1008] shadow-sm'
                        : 'bg-[#18120B] text-[#FDE68A] hover:bg-[#342214]'
                    }`}
                  >
                    {name}
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
            className="w-full min-h-[52px] rounded-2xl bg-[#22C55E] hover:bg-[#4ADE80] active:scale-[0.99] border-2 border-[#1C1008] px-6 py-3 font-display text-lg sm:text-xl font-black tracking-wide text-[#052E16] shadow-[0_5px_0_#1C1008] transition-all cursor-pointer"
          >
            START 3-LAP GP ({currentRacer.toUpperCase()})
          </button>

          {/* Compact Track Rules Legend */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#FDE68A]/85 px-1">
            <span>₹ Coins: -0.20s &amp; Chai Charge</span>
            <span>·</span>
            <span>Chai Cup: DRS Nitro</span>
            <span>·</span>
            <span>3 Laps to Finish</span>
          </div>
        </div>

        {/* Saved Pass-the-Phone Leaderboard Preview (Unique Best Score Per Player!) */}
        {records.leaderboard.length > 0 && (
          <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-[#1C1008]/92 border-2 border-[#F59E0B]/70 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#FEF08A]">
                Best Score Per Racer
              </h2>
              <span className="text-[11px] text-[#FDE68A]/75">
                Personal Bests Only
              </span>
            </div>
            <div className="space-y-1.5">
              {records.leaderboard.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.id || `${entry.playerName}-${idx}`}
                  className="flex items-center justify-between rounded-xl bg-[#2A1B0E] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-[#FFFBEB]">
                    <span className="font-mono-tabular text-[#F59E0B]">
                      #{idx + 1}
                    </span>
                    <span>{entry.playerName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono-tabular">
                    <span className="text-[#FDE68A]/80">₹{entry.coins}</span>
                    <span className="font-extrabold text-[#4ADE80]">
                      {formatRaceTime(entry.totalTimeMs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flat Borderless Bottom Control Hint */}
      <div className="text-center text-xs sm:text-sm font-semibold text-[#FEF08A] hud-stroke-sm">
        WASD / Arrows Drive &amp; Steer · Space Horn &amp; Chai Turbo · C View · M Mute
      </div>
    </div>
  );
};
