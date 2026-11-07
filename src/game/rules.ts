import {
  getActiveTrack,
  getClosestTrackProjection,
  getTrackPointAtProgress,
  getTrackWorldPoint,
  ROAD_HALF_WIDTH,
  setActiveTrack,
  TOTAL_LAPS,
  TrackMapId,
} from './track';

export { TOTAL_LAPS };
export type { TrackMapId };

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type PowerUpType = 'chai_nitro' | 'magnet' | 'shield';

export type ObstacleType = 'cow' | 'cart' | 'puddle' | 'cone';

export interface CoinEntity {
  id: number;
  x: number;
  y: number;
  progress: number;
  lateralOffset: number;
  collected: boolean;
  bobPhase: number;
}

export interface PowerUpEntity {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  progress: number;
  lateralOffset: number;
  active: boolean;
  respawnTimer: number;
}

export interface ObstacleEntity {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  progress: number;
  lateralOffset: number;
  radius: number;
  angle: number;
  patrolPhase: number;
  hitCooldown: number;
  knockVx: number;
  knockVy: number;
}

export interface InputState {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  hornJustPressed: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  angularVelocity: number;
  leanAngle: number;
  onRoad: boolean;
  activePowerUp: PowerUpType | null;
  powerUpTimer: number;
  hasShield: boolean;
  spinTimer: number;
  hitFlashTimer: number;
  hornCooldown: number;
  hornWaveTimer: number;
  pocketChaiMeter: number; // 0..5 coins charges a manual Chai Boost on Horn/Space!
}

export interface RaceSessionState {
  phase: GamePhase;
  trackId: TrackMapId;
  player: PlayerState;
  currentLap: number;
  totalLaps: number;
  checkpointsPassed: [boolean, boolean, boolean]; // 25%, 50%, 75%
  lastProgress: number;
  elapsedMs: number;
  currentLapStartMs: number;
  lapSplitsMs: number[];
  coinsCollected: number;
  timeBonusMs: number;
  hitstopTimer: number;
  cameraTrauma: number;
  coins: CoinEntity[];
  powerUps: PowerUpEntity[];
  obstacles: ObstacleEntity[];
  statusBanner: { text: string; color: string; timer: number } | null;
}

export interface StepEvents {
  coinPickedUp: boolean;
  powerUpPickedUp: PowerUpType | null;
  obstacleHit: ObstacleType | null;
  shieldBroken: boolean;
  lapCompleted: number | null;
  raceFinished: boolean;
  hornHonked: boolean;
  cowStartled: boolean;
  pocketBoostTriggered: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  totalTimeMs: number;
  bestLapMs: number;
  coins: number;
  timestamp: number;
  trackId?: TrackMapId;
}

export interface SavedRecords {
  bestTimeMs: number | null;
  bestLapMs: number | null;
  lastPlayerName: string;
  recentNames: string[];
  leaderboard: LeaderboardEntry[];
}

export const STORAGE_KEY = 'auto_rally_records_v1';

export const DEFAULT_TRAIN_CREW_NAMES = ['Aarav', 'Priya', 'Rohan', 'Ananya'];

export function createInitialCoins(): CoinEntity[] {
  const coins: CoinEntity[] = [];
  let id = 1;

  // Clusters of coins placed along racing lines around the loop
  const clusters = [
    { start: 0.04, count: 4, spacing: 0.016, offset: -25 },
    { start: 0.16, count: 5, spacing: 0.015, offset: 32 },
    { start: 0.30, count: 4, spacing: 0.016, offset: -30 },
    { start: 0.44, count: 5, spacing: 0.014, offset: 25 },
    { start: 0.60, count: 4, spacing: 0.016, offset: -28 },
    { start: 0.75, count: 4, spacing: 0.015, offset: 30 },
    { start: 0.88, count: 4, spacing: 0.015, offset: 0 },
  ];

  for (const c of clusters) {
    for (let i = 0; i < c.count; i++) {
      const prog = (c.start + i * c.spacing) % 1;
      const pt = getTrackWorldPoint(prog, c.offset);
      coins.push({
        id: id++,
        x: pt.x,
        y: pt.y,
        progress: prog,
        lateralOffset: c.offset,
        collected: false,
        bobPhase: i * 0.7,
      });
    }
  }

  return coins;
}

export function createInitialPowerUps(): PowerUpEntity[] {
  const specs: Array<{ progress: number; offset: number; type: PowerUpType }> = [
    { progress: 0.11, offset: 22, type: 'chai_nitro' },
    { progress: 0.26, offset: -26, type: 'magnet' },
    { progress: 0.41, offset: 24, type: 'shield' },
    { progress: 0.56, offset: -20, type: 'chai_nitro' },
    { progress: 0.71, offset: 26, type: 'magnet' },
    { progress: 0.85, offset: -24, type: 'chai_nitro' },
  ];

  return specs.map((s, idx) => {
    const pt = getTrackWorldPoint(s.progress, s.offset);
    return {
      id: idx + 1,
      type: s.type,
      x: pt.x,
      y: pt.y,
      progress: s.progress,
      lateralOffset: s.offset,
      active: true,
      respawnTimer: 0,
    };
  });
}

export function createInitialObstacles(): ObstacleEntity[] {
  const specs: Array<{
    progress: number;
    offset: number;
    type: ObstacleType;
    radius: number;
  }> = [
    { progress: 0.14, offset: -36, type: 'cone', radius: 16 },
    { progress: 0.23, offset: 18, type: 'cow', radius: 24 },
    { progress: 0.36, offset: 40, type: 'cart', radius: 28 },
    { progress: 0.49, offset: -26, type: 'puddle', radius: 28 },
    { progress: 0.54, offset: 34, type: 'cone', radius: 16 },
    { progress: 0.67, offset: -12, type: 'cow', radius: 24 },
    { progress: 0.79, offset: -42, type: 'cart', radius: 28 },
    { progress: 0.92, offset: 32, type: 'puddle', radius: 28 },
  ];

  return specs.map((s, idx) => {
    const sample = getTrackPointAtProgress(s.progress);
    const pt = getTrackWorldPoint(s.progress, s.offset);
    return {
      id: idx + 1,
      type: s.type,
      x: pt.x,
      y: pt.y,
      baseX: pt.x,
      baseY: pt.y,
      progress: s.progress,
      lateralOffset: s.offset,
      radius: s.radius,
      angle: sample.angle,
      patrolPhase: idx * 1.4,
      hitCooldown: 0,
      knockVx: 0,
      knockVy: 0,
    };
  });
}

export function createInitialRaceState(
  phase: GamePhase = 'title',
  trackId?: TrackMapId
): RaceSessionState {
  const activeTrack = trackId ? setActiveTrack(trackId) : getActiveTrack();
  const startSample = getTrackPointAtProgress(0);
  // Spawn slightly behind the start line facing clear open road (+X)
  const spawnSample = getTrackPointAtProgress(0.985);

  return {
    phase,
    trackId: activeTrack.id,
    player: {
      x: spawnSample.x,
      y: spawnSample.y,
      vx: 0,
      vy: 0,
      speed: 0,
      angle: startSample.angle,
      angularVelocity: 0,
      leanAngle: 0,
      onRoad: true,
      activePowerUp: null,
      powerUpTimer: 0,
      hasShield: false,
      spinTimer: 0,
      hitFlashTimer: 0,
      hornCooldown: 0,
      hornWaveTimer: 0,
      pocketChaiMeter: 0,
    },
    currentLap: 1,
    totalLaps: TOTAL_LAPS,
    checkpointsPassed: [false, false, false],
    lastProgress: 0.985,
    elapsedMs: 0,
    currentLapStartMs: 0,
    lapSplitsMs: [],
    coinsCollected: 0,
    timeBonusMs: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    coins: createInitialCoins(),
    powerUps: createInitialPowerUps(),
    obstacles: createInitialObstacles(),
    statusBanner: null,
  };
}

export function normalizeAngleDiff(target: number, current: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function stepRaceSimulation(
  state: RaceSessionState,
  input: InputState,
  rawDt: number
): StepEvents {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const events: StepEvents = {
    coinPickedUp: false,
    powerUpPickedUp: null,
    obstacleHit: null,
    shieldBroken: false,
    lapCompleted: null,
    raceFinished: false,
    hornHonked: false,
    cowStartled: false,
    pocketBoostTriggered: false,
  };

  if (state.phase !== 'playing') {
    return events;
  }

  // Decay camera trauma & UI banner in real dt
  state.cameraTrauma = Math.max(0, state.cameraTrauma - dt * 1.8);
  if (state.statusBanner) {
    state.statusBanner.timer -= dt;
    if (state.statusBanner.timer <= 0) {
      state.statusBanner = null;
    }
  }

  // Hitstop freeze for heavy impacts
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  const player = state.player;

  // Advance race clock
  state.elapsedMs += dt * 1000;

  // Timers on player
  if (player.powerUpTimer > 0) {
    player.powerUpTimer = Math.max(0, player.powerUpTimer - dt);
    if (player.powerUpTimer === 0) {
      player.activePowerUp = null;
    }
  }
  if (player.spinTimer > 0) {
    player.spinTimer = Math.max(0, player.spinTimer - dt);
  }
  if (player.hitFlashTimer > 0) {
    player.hitFlashTimer = Math.max(0, player.hitFlashTimer - dt);
  }
  if (player.hornCooldown > 0) {
    player.hornCooldown = Math.max(0, player.hornCooldown - dt);
  }
  if (player.hornWaveTimer > 0) {
    player.hornWaveTimer = Math.max(0, player.hornWaveTimer - dt);
  }

  // Handle Horn / Pocket Chai Boost
  if (input.hornJustPressed && player.hornCooldown <= 0) {
    player.hornCooldown = 0.45;
    player.hornWaveTimer = 0.4;
    events.hornHonked = true;

    // If Pocket Chai Meter is full (5 coins), trigger a Chai Nitro surge!
    if (player.pocketChaiMeter >= 5) {
      player.pocketChaiMeter = 0;
      player.activePowerUp = 'chai_nitro';
      player.powerUpTimer = Math.max(player.powerUpTimer, 3.8);
      player.speed = Math.max(player.speed, 460);
      events.pocketBoostTriggered = true;
      state.statusBanner = {
        text: 'GARAM CHAI TURBO!',
        color: '#F59E0B',
        timer: 1.6,
      };
    }

    // Startle nearby cows out of the road!
    for (const obs of state.obstacles) {
      if (obs.type === 'cow') {
        const dist = Math.hypot(obs.x - player.x, obs.y - player.y);
        if (dist < 240) {
          const sample = getTrackPointAtProgress(obs.progress);
          const pushDir = obs.lateralOffset >= 0 ? 1 : -1;
          obs.knockVx = sample.normalX * pushDir * 190;
          obs.knockVy = sample.normalY * pushDir * 190;
          events.cowStartled = true;
        }
      }
    }
  }

  // Track projection & surface check
  const proj = getClosestTrackProjection(player.x, player.y);
  player.onRoad = proj.distanceFromCenter <= ROAD_HALF_WIDTH + 10;

  // Physics constants
  const isNitro = player.activePowerUp === 'chai_nitro' && player.powerUpTimer > 0;
  const baseTopSpeed = 355;
  const offRoadFactor = player.onRoad || isNitro ? 1.0 : 0.68;
  const nitroFactor = isNitro ? 1.44 : 1.0;
  const maxForwardSpeed = baseTopSpeed * offRoadFactor * nitroFactor;
  const maxReverseSpeed = -130;

  const accelRate = isNitro ? 540 : 340;
  const brakeRate = 440;
  const dragRate = player.onRoad ? 145 : 260;

  if (player.spinTimer > 0) {
    // Puddle spin wobble
    player.angle += 7.5 * dt;
    player.speed *= Math.pow(0.45, dt);
  } else {
    if (input.accelerate) {
      player.speed += accelRate * dt;
    } else if (input.brake) {
      player.speed -= brakeRate * dt;
    } else {
      if (player.speed > 0) {
        player.speed = Math.max(0, player.speed - dragRate * dt);
      } else if (player.speed < 0) {
        player.speed = Math.min(0, player.speed + dragRate * dt);
      }
    }

    // Clamp speed
    if (player.speed > maxForwardSpeed) {
      player.speed = Math.max(
        maxForwardSpeed,
        player.speed - 320 * dt
      );
    }
    if (player.speed < maxReverseSpeed) {
      player.speed = maxReverseSpeed;
    }

    // Progressive, silky-smooth steering response
    const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const speedRatio = Math.min(1, Math.abs(player.speed) / 95);
    const reverseSign = player.speed >= -5 ? 1 : -1;
    const turnRate = 2.85;
    const steerSmooth = 1 - Math.exp(-16 * dt);

    if (steerInput !== 0 && Math.abs(player.speed) > 4) {
      const targetAngVel =
        steerInput * turnRate * Math.max(0.38, speedRatio) * reverseSign;
      player.angularVelocity +=
        (targetAngVel - player.angularVelocity) * steerSmooth;
      player.angle += player.angularVelocity * dt;
      player.leanAngle +=
        (steerInput * 0.22 - player.leanAngle) * Math.min(1, dt * 12);
    } else {
      player.angularVelocity *= Math.exp(-18 * dt);
      if (Math.abs(player.angularVelocity) < 0.01) {
        player.angularVelocity = 0;
      }
      player.angle += player.angularVelocity * dt;
      player.leanAngle += (0 - player.leanAngle) * Math.min(1, dt * 12);
    }
  }

  // Update velocity with smooth tire grip interpolation
  const targetVx = Math.cos(player.angle) * player.speed;
  const targetVy = Math.sin(player.angle) * player.speed;
  const grip = player.onRoad ? 11.5 : 6.0;
  const gripFactor = 1 - Math.exp(-grip * dt);
  player.vx += (targetVx - player.vx) * gripFactor;
  player.vy += (targetVy - player.vy) * gripFactor;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Soft outer boundary containment so player never leaves the world arena
  const postProj = getClosestTrackProjection(player.x, player.y);
  const maxOffRoadDist = ROAD_HALF_WIDTH + 95;
  if (postProj.distanceFromCenter > maxOffRoadDist) {
    const sample = getTrackPointAtProgress(postProj.progress);
    const sign = postProj.signedLateralOffset >= 0 ? 1 : -1;
    player.x = sample.x + sample.normalX * sign * maxOffRoadDist;
    player.y = sample.y + sample.normalY * sign * maxOffRoadDist;
    player.speed *= 0.82;
  }

  // Update coins & Magnet attraction
  const magnetActive = player.activePowerUp === 'magnet' && player.powerUpTimer > 0;
  const pickupRadius = 34;
  const magnetRadius = 215;

  for (const coin of state.coins) {
    if (coin.collected) continue;
    coin.bobPhase += dt * 4.5;

    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    const dist = Math.hypot(dx, dy);

    if (magnetActive && dist < magnetRadius && dist > 1) {
      const pullSpeed = 460;
      coin.x += (dx / dist) * pullSpeed * dt;
      coin.y += (dy / dist) * pullSpeed * dt;
    }

    if (dist <= pickupRadius) {
      coin.collected = true;
      state.coinsCollected += 1;
      state.timeBonusMs += 200; // Each coin shaves 0.20s off effective timer!
      state.elapsedMs = Math.max(0, state.elapsedMs - 200);
      player.speed = Math.min(maxForwardSpeed + 35, player.speed + 24);
      if (player.pocketChaiMeter < 5) {
        player.pocketChaiMeter += 1;
      }
      events.coinPickedUp = true;
    }
  }

  // Update Power-Ups
  for (const pu of state.powerUps) {
    if (!pu.active) {
      pu.respawnTimer -= dt;
      if (pu.respawnTimer <= 0) {
        pu.active = true;
      }
      continue;
    }

    const dist = Math.hypot(player.x - pu.x, player.y - pu.y);
    if (dist <= 38) {
      pu.active = false;
      pu.respawnTimer = 8.0;
      events.powerUpPickedUp = pu.type;

      if (pu.type === 'shield') {
        player.hasShield = true;
        state.statusBanner = {
          text: 'NIMBU SHIELD ACTIVE!',
          color: '#22C55E',
          timer: 1.6,
        };
      } else if (pu.type === 'chai_nitro') {
        player.activePowerUp = 'chai_nitro';
        player.powerUpTimer = 4.5;
        player.speed = Math.max(player.speed, 470);
        state.statusBanner = {
          text: 'MASALA CHAI NITRO!',
          color: '#F59E0B',
          timer: 1.6,
        };
      } else if (pu.type === 'magnet') {
        player.activePowerUp = 'magnet';
        player.powerUpTimer = 6.0;
        state.statusBanner = {
          text: 'MARIGOLD COIN MAGNET!',
          color: '#EC4899',
          timer: 1.6,
        };
      }
    }
  }

  // Update Obstacles & Collisions
  const playerRadius = 20;
  for (const obs of state.obstacles) {
    if (obs.hitCooldown > 0) {
      obs.hitCooldown = Math.max(0, obs.hitCooldown - dt);
    }

    // Cow slow patrol movement across road width
    if (obs.type === 'cow') {
      obs.patrolPhase += dt * 1.15;
      const sample = getTrackPointAtProgress(obs.progress);
      const swayOffset = obs.lateralOffset + Math.sin(obs.patrolPhase) * 32;
      const targetX = sample.x + sample.normalX * swayOffset;
      const targetY = sample.y + sample.normalY * swayOffset;
      obs.x += (targetX - obs.x) * Math.min(1, dt * 3) + obs.knockVx * dt;
      obs.y += (targetY - obs.y) * Math.min(1, dt * 3) + obs.knockVy * dt;
    } else {
      obs.x += obs.knockVx * dt;
      obs.y += obs.knockVy * dt;
      // Gently settle back toward base position for knocked cones
      obs.x += (obs.baseX - obs.x) * Math.min(1, dt * 0.8);
      obs.y += (obs.baseY - obs.y) * Math.min(1, dt * 0.8);
    }

    obs.knockVx *= Math.pow(0.08, dt);
    obs.knockVy *= Math.pow(0.08, dt);

    if (obs.hitCooldown <= 0) {
      const dx = player.x - obs.x;
      const dy = player.y - obs.y;
      const dist = Math.hypot(dx, dy);

      if (dist < playerRadius + obs.radius) {
        obs.hitCooldown = 1.1;

        if (player.hasShield || isNitro) {
          if (player.hasShield && !isNitro) {
            player.hasShield = false;
            events.shieldBroken = true;
            state.statusBanner = {
              text: 'SHIELD BLOCKED HIT!',
              color: '#38BDF8',
              timer: 1.3,
            };
          }
          // Knock obstacle away
          const nx = (obs.x - player.x) / (dist || 1);
          const ny = (obs.y - player.y) / (dist || 1);
          obs.knockVx = nx * 280;
          obs.knockVy = ny * 280;
        } else {
          events.obstacleHit = obs.type;
          player.hitFlashTimer = 0.25;

          if (obs.type === 'puddle') {
            player.spinTimer = 0.42;
            player.speed *= 0.55;
            state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.35);
            state.statusBanner = {
              text: 'MONSOON SLIP!',
              color: '#38BDF8',
              timer: 1.2,
            };
          } else if (obs.type === 'cone') {
            const nx = (obs.x - player.x) / (dist || 1);
            const ny = (obs.y - player.y) / (dist || 1);
            obs.knockVx = nx * 320;
            obs.knockVy = ny * 320;
            player.speed *= 0.72;
            state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
          } else {
            // Solid bump against spice cart or cow
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            player.x = obs.x + nx * (playerRadius + obs.radius + 4);
            player.y = obs.y + ny * (playerRadius + obs.radius + 4);
            player.vx = nx * 130;
            player.vy = ny * 130;
            player.speed = -75;
            state.hitstopTimer = 0.045;
            state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.65);
            state.statusBanner = {
              text: obs.type === 'cow' ? 'HOLY COW! HONK [SPACE]!' : 'SPICE CART BUMP!',
              color: '#EF4444',
              timer: 1.4,
            };
          }
        }
      }
    }
  }

  // Update Checkpoints & Lap Counter
  const currentProgress = postProj.progress;
  if (currentProgress >= 0.20 && currentProgress <= 0.35) {
    state.checkpointsPassed[0] = true;
  }
  if (currentProgress >= 0.45 && currentProgress <= 0.60 && state.checkpointsPassed[0]) {
    state.checkpointsPassed[1] = true;
  }
  if (currentProgress >= 0.70 && currentProgress <= 0.85 && state.checkpointsPassed[1]) {
    state.checkpointsPassed[2] = true;
  }

  // Detect crossing start/finish line (progress wraps from > 0.88 to < 0.15)
  const crossedFinishForward =
    state.lastProgress > 0.85 &&
    currentProgress < 0.20 &&
    state.checkpointsPassed[0] &&
    state.checkpointsPassed[1] &&
    state.checkpointsPassed[2];

  if (crossedFinishForward) {
    const lapTimeMs = Math.max(1000, state.elapsedMs - state.currentLapStartMs);
    state.lapSplitsMs.push(lapTimeMs);
    state.currentLapStartMs = state.elapsedMs;
    state.checkpointsPassed = [false, false, false];
    events.lapCompleted = state.currentLap;

    if (state.currentLap >= state.totalLaps) {
      state.phase = 'gameover';
      events.raceFinished = true;
    } else {
      state.currentLap += 1;
      // Respawn coins on new lap so every lap has fresh coins!
      for (const coin of state.coins) {
        const pt = getTrackWorldPoint(coin.progress, coin.lateralOffset);
        coin.x = pt.x;
        coin.y = pt.y;
        coin.collected = false;
      }
      state.statusBanner = {
        text:
          state.currentLap === state.totalLaps
            ? 'FINAL LAP! GO GO GO!'
            : `LAP ${state.currentLap} / ${state.totalLaps}`,
        color: '#FACC15',
        timer: 2.0,
      };
    }
  }

  state.lastProgress = currentProgress;
  return events;
}

export function formatRaceTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) {
    return '--:--.--';
  }
  const clamped = Math.max(0, Math.round(ms));
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const hundredths = Math.floor((clamped % 1000) / 10);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cs = String(hundredths).padStart(2, '0');
  return `${mm}:${ss}.${cs}`;
}

/**
 * Deduplicates leaderboard entries by player name (case-insensitive, trimmed)
 * and keeps ONLY the single best (lowest totalTimeMs) score for each player.
 */
export function deduplicateLeaderboard(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  const bestByPlayer = new Map<string, LeaderboardEntry>();

  for (const entry of entries) {
    if (!entry || typeof entry.playerName !== 'string') continue;
    const cleanName = entry.playerName.trim() || 'Racer';
    const key = cleanName.toLowerCase();
    const existing = bestByPlayer.get(key);

    if (!existing) {
      bestByPlayer.set(key, { ...entry, playerName: cleanName });
    } else if (entry.totalTimeMs < existing.totalTimeMs) {
      bestByPlayer.set(key, {
        ...entry,
        playerName: cleanName,
        bestLapMs: Math.min(entry.bestLapMs, existing.bestLapMs),
      });
    } else {
      // Keep existing best totalTimeMs, but preserve fastest bestLapMs if improved
      existing.bestLapMs = Math.min(existing.bestLapMs, entry.bestLapMs);
    }
  }

  return Array.from(bestByPlayer.values())
    .sort((a, b) => a.totalTimeMs - b.totalTimeMs)
    .slice(0, 10);
}

export function loadSavedRecords(storage?: Pick<Storage, 'getItem'>): SavedRecords {
  const defaultRecords: SavedRecords = {
    bestTimeMs: null,
    bestLapMs: null,
    lastPlayerName: 'Aarav',
    recentNames: [...DEFAULT_TRAIN_CREW_NAMES],
    leaderboard: [],
  };

  const store =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return defaultRecords;

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return defaultRecords;
    const parsed = JSON.parse(raw) as Partial<SavedRecords>;
    const dedupedLeaderboard = Array.isArray(parsed.leaderboard)
      ? deduplicateLeaderboard(parsed.leaderboard)
      : [];
    return {
      bestTimeMs: typeof parsed.bestTimeMs === 'number' ? parsed.bestTimeMs : null,
      bestLapMs: typeof parsed.bestLapMs === 'number' ? parsed.bestLapMs : null,
      lastPlayerName:
        typeof parsed.lastPlayerName === 'string' && parsed.lastPlayerName.trim()
          ? parsed.lastPlayerName.trim()
          : 'Aarav',
      recentNames:
        Array.isArray(parsed.recentNames) && parsed.recentNames.length > 0
          ? parsed.recentNames
          : [...DEFAULT_TRAIN_CREW_NAMES],
      leaderboard: dedupedLeaderboard,
    };
  } catch {
    return defaultRecords;
  }
}

export function recordFinishedRace(
  prev: SavedRecords,
  params: {
    playerName: string;
    totalTimeMs: number;
    lapSplitsMs: number[];
    coins: number;
    trackId?: TrackMapId;
  },
  storage?: Pick<Storage, 'setItem'>
): { updated: SavedRecords; isNewBestTime: boolean; isNewBestLap: boolean } {
  const cleanName = params.playerName.trim() || 'Racer';
  const totalTimeMs = Math.max(1000, Math.round(params.totalTimeMs));
  const runBestLapMs =
    params.lapSplitsMs.length > 0
      ? Math.min(...params.lapSplitsMs.map((t) => Math.round(t)))
      : Math.round(totalTimeMs / TOTAL_LAPS);

  const isNewBestTime = prev.bestTimeMs === null || totalTimeMs < prev.bestTimeMs;
  const isNewBestLap = prev.bestLapMs === null || runBestLapMs < prev.bestLapMs;

  const newEntry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerName: cleanName,
    totalTimeMs,
    bestLapMs: runBestLapMs,
    coins: params.coins,
    timestamp: Date.now(),
    trackId: params.trackId,
  };

  const leaderboard = deduplicateLeaderboard([...prev.leaderboard, newEntry]);

  const recentNames = Array.from(
    new Set([cleanName, ...prev.recentNames, ...DEFAULT_TRAIN_CREW_NAMES])
  ).slice(0, 6);

  const updated: SavedRecords = {
    bestTimeMs: isNewBestTime ? totalTimeMs : prev.bestTimeMs,
    bestLapMs: isNewBestLap ? runBestLapMs : prev.bestLapMs,
    lastPlayerName: cleanName,
    recentNames,
    leaderboard,
  };

  const store =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (store) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
  }

  return { updated, isNewBestTime, isNewBestLap };
}
