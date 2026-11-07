export interface Vec2 {
  x: number;
  y: number;
}

export interface TrackSample {
  x: number;
  y: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
  angle: number;
  progress: number;
}

export interface TrackProjection {
  progress: number;
  distanceFromCenter: number;
  signedLateralOffset: number;
  closestPoint: Vec2;
  roadAngle: number;
  tangentX: number;
  tangentY: number;
}

export type TrackMapId = 'buddh_gp' | 'marina_street' | 'ghats_gp';

export interface TrackMapConfig {
  id: TrackMapId;
  name: string;
  subtitle: string;
  location: string;
  corners: number;
  difficulty: 'Technical F1' | 'Street Circuit' | 'High-Speed GP';
  kerbPrimaryColor: string;
  kerbSecondaryColor: string;
  outfieldColor: string;
  infieldColor: string;
  waterColor: string;
  controlPoints: Vec2[];
  samples: TrackSample[];
  svgMinimapPoints: string;
}

export const ROAD_HALF_WIDTH = 94;
export const CURB_WIDTH = 16;
export const TOTAL_LAPS = 3;

const SAMPLE_COUNT = 960;

function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function buildSamplesFromControlPoints(controlPoints: Vec2[]): TrackSample[] {
  const n = controlPoints.length;
  const rawPoints: Vec2[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const u = (i / SAMPLE_COUNT) * n;
    const seg = Math.floor(u) % n;
    const localT = u - Math.floor(u);

    const p0 = controlPoints[(seg - 1 + n) % n];
    const p1 = controlPoints[seg];
    const p2 = controlPoints[(seg + 1) % n];
    const p3 = controlPoints[(seg + 2) % n];

    rawPoints.push(catmullRom(p0, p1, p2, p3, localT));
  }

  const samples: TrackSample[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const prev = rawPoints[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT];
    const curr = rawPoints[i];
    const next = rawPoints[(i + 1) % SAMPLE_COUNT];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const tangentX = dx / len;
    const tangentY = dy / len;
    const normalX = -tangentY;
    const normalY = tangentX;

    samples.push({
      x: curr.x,
      y: curr.y,
      tangentX,
      tangentY,
      normalX,
      normalY,
      angle: Math.atan2(tangentY, tangentX),
      progress: i / SAMPLE_COUNT,
    });
  }

  return samples;
}

function buildSvgPoints(samples: TrackSample[]): string {
  return samples
    .filter((_, idx) => idx % 10 === 0)
    .map((s) => `${Math.round(s.x)},${Math.round(s.y)}`)
    .join(' ');
}

const RAW_TRACK_DEFS: Array<
  Omit<TrackMapConfig, 'samples' | 'svgMinimapPoints'>
> = [
  {
    id: 'buddh_gp',
    name: 'Buddh International GP',
    subtitle: 'Long DRS Straight, Hairpin & Parabolica',
    location: 'Greater Noida F1 Circuit',
    corners: 16,
    difficulty: 'Technical F1',
    kerbPrimaryColor: '#DC2626',
    kerbSecondaryColor: '#FFFFFF',
    outfieldColor: '#3F6212',
    infieldColor: '#4D7C0F',
    waterColor: '#0284C7',
    controlPoints: [
      { x: 0, y: 780 }, // 0: Start/Finish Main Pit Straight
      { x: 650, y: 780 }, // 1: Main Straight DRS Zone
      { x: 1220, y: 760 }, // 2: Turn 1 Heavy Braking Zone
      { x: 1320, y: 380 }, // 3: Turn 2 Short Shoot
      { x: 820, y: 260 }, // 4: Turn 3 Deep Infield Hairpin Apex
      { x: 1380, y: -60 }, // 5: Diagonal Back Straight
      { x: 1420, y: -640 }, // 6: Turn 4 Acute Braking Corner
      { x: 860, y: -820 }, // 7: Northern Parabolica Entry
      { x: 420, y: -420 }, // 8: Deep Infield Spoon Chicane
      { x: -40, y: -440 }, // 9: Infield Chicane Exit
      { x: -380, y: -840 }, // 10: North-West High-Speed Sweeper
      { x: -1120, y: -820 }, // 11: Western Sector Entry
      { x: -1360, y: -380 }, // 12: Fast Esses Left
      { x: -920, y: -60 }, // 13: Fast Esses Right Apex
      { x: -1380, y: 340 }, // 14: Turn 15 Hairpin Entry
      { x: -1180, y: 760 }, // 15: Final Corner Exit
      { x: -560, y: 780 }, // 16: Main Pit Straight Approach
    ],
  },
  {
    id: 'marina_street',
    name: 'Mumbai Marina Street GP',
    subtitle: '90° Harbor Corners, Tunnel & Rascasse Hairpin',
    location: 'Marine Drive Street Circuit',
    corners: 18,
    difficulty: 'Street Circuit',
    kerbPrimaryColor: '#0284C7',
    kerbSecondaryColor: '#FEF08A',
    outfieldColor: '#475569',
    infieldColor: '#365314',
    waterColor: '#0369A1',
    controlPoints: [
      { x: 0, y: 760 }, // 0: Marina Boulevard Start/Finish
      { x: 740, y: 760 }, // 1: Boulevard DRS Straight
      { x: 1340, y: 740 }, // 2: Turn 1 90° Street Corner
      { x: 1340, y: 120 }, // 3: Harborfront Straight
      { x: 960, y: 100 }, // 4: Tight 90° Infield Left
      { x: 960, y: -360 }, // 5: Uphill Street Shoot
      { x: 1380, y: -420 }, // 6: Mirabeau Right-Hander
      { x: 1360, y: -820 }, // 7: Grand Hotel Hairpin
      { x: 520, y: -820 }, // 8: Seafront Tunnel Straight
      { x: 260, y: -480 }, // 9: Harbor Chicane Left
      { x: -180, y: -480 }, // 10: Harbor Chicane Right
      { x: -460, y: -820 }, // 11: Tabac Fast Corner
      { x: -1280, y: -800 }, // 12: Swimming Pool Complex Entry
      { x: -1320, y: -180 }, // 13: West Quay Straight
      { x: -780, y: -120 }, // 14: Rascasse Tight Hairpin
      { x: -1320, y: 380 }, // 15: Final Chicane Entry
      { x: -1220, y: 750 }, // 16: Pit Entry Corner
      { x: -580, y: 760 }, // 17: Main Straight Approach
    ],
  },
  {
    id: 'ghats_gp',
    name: 'Western Ghats Monsoon GP',
    subtitle: 'High-Speed Monza Chicane, Lesmos & Valley Hairpin',
    location: 'Sahyadri Highland Circuit',
    corners: 12,
    difficulty: 'High-Speed GP',
    kerbPrimaryColor: '#EA580C',
    kerbSecondaryColor: '#FEF08A',
    outfieldColor: '#9A3412',
    infieldColor: '#4D7C0F',
    waterColor: '#0284C7',
    controlPoints: [
      { x: 0, y: 740 }, // 0: Grand Prix Main Straight
      { x: 780, y: 740 }, // 1: High-Speed DRS Straight
      { x: 1420, y: 660 }, // 2: Prima Variante Chicane Entry
      { x: 1120, y: 260 }, // 3: Variante Chicane Apex
      { x: 1460, y: -140 }, // 4: Curva Grande Fast Sweeper
      { x: 1240, y: -780 }, // 5: Lesmo 1 Corner
      { x: 640, y: -860 }, // 6: Lesmo 2 Corner
      { x: 120, y: -280 }, // 7: Deep Valley Hairpin Bend
      { x: -380, y: -840 }, // 8: Ascari Esses Entry
      { x: -1180, y: -780 }, // 9: Back Straight Approach
      { x: -1440, y: -120 }, // 10: Back Straight Southbound
      { x: -1380, y: 580 }, // 11: Parabolica Hairpin Entry
      { x: -660, y: 740 }, // 12: Parabolica Exit onto Main Straight
    ],
  },
];

export const TRACK_MAPS: TrackMapConfig[] = RAW_TRACK_DEFS.map((def) => {
  const samples = buildSamplesFromControlPoints(def.controlPoints);
  return {
    ...def,
    samples,
    svgMinimapPoints: buildSvgPoints(samples),
  };
});

let currentTrackMap: TrackMapConfig = TRACK_MAPS[0];

// Live array reference kept in sync with the active circuit map
export const TRACK_SAMPLES: TrackSample[] = [...currentTrackMap.samples];
export const TRACK_CONTROL_POINTS: Vec2[] = [...currentTrackMap.controlPoints];

export function getActiveTrack(): TrackMapConfig {
  return currentTrackMap;
}

export function getTrackById(id: TrackMapId): TrackMapConfig {
  return TRACK_MAPS.find((m) => m.id === id) ?? TRACK_MAPS[0];
}

export function setActiveTrack(id: TrackMapId): TrackMapConfig {
  const found = getTrackById(id);
  currentTrackMap = found;
  TRACK_SAMPLES.length = 0;
  TRACK_SAMPLES.push(...found.samples);
  TRACK_CONTROL_POINTS.length = 0;
  TRACK_CONTROL_POINTS.push(...found.controlPoints);
  return found;
}

export function normalizeProgress(p: number): number {
  const mod = p % 1;
  return mod < 0 ? mod + 1 : mod;
}

export function getTrackPointAtProgress(progress: number): TrackSample {
  const norm = normalizeProgress(progress);
  const exactIdx = norm * SAMPLE_COUNT;
  const idx0 = Math.floor(exactIdx) % SAMPLE_COUNT;
  const idx1 = (idx0 + 1) % SAMPLE_COUNT;
  const frac = exactIdx - Math.floor(exactIdx);

  const s0 = TRACK_SAMPLES[idx0];
  const s1 = TRACK_SAMPLES[idx1];

  const x = s0.x + (s1.x - s0.x) * frac;
  const y = s0.y + (s1.y - s0.y) * frac;
  const tx = s0.tangentX + (s1.tangentX - s0.tangentX) * frac;
  const ty = s0.tangentY + (s1.tangentY - s0.tangentY) * frac;
  const len = Math.hypot(tx, ty) || 1;
  const tangentX = tx / len;
  const tangentY = ty / len;

  return {
    x,
    y,
    tangentX,
    tangentY,
    normalX: -tangentY,
    normalY: tangentX,
    angle: Math.atan2(tangentY, tangentX),
    progress: norm,
  };
}

export function getTrackWorldPoint(
  progress: number,
  lateralOffset: number
): Vec2 {
  const sample = getTrackPointAtProgress(progress);
  return {
    x: sample.x + sample.normalX * lateralOffset,
    y: sample.y + sample.normalY * lateralOffset,
  };
}

export function getClosestTrackProjection(
  x: number,
  y: number
): TrackProjection {
  let bestIdx = 0;
  let bestDistSq = Infinity;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const s = TRACK_SAMPLES[i];
    const dx = x - s.x;
    const dy = y - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestIdx = i;
    }
  }

  const prevIdx = (bestIdx - 1 + SAMPLE_COUNT) % SAMPLE_COUNT;
  const nextIdx = (bestIdx + 1) % SAMPLE_COUNT;
  const curr = TRACK_SAMPLES[bestIdx];
  const next = TRACK_SAMPLES[nextIdx];
  const prev = TRACK_SAMPLES[prevIdx];

  const segDx = next.x - prev.x;
  const segDy = next.y - prev.y;
  const segLenSq = segDx * segDx + segDy * segDy || 1;
  const relX = x - curr.x;
  const relY = y - curr.y;

  const projOffset =
    (relX * curr.tangentX + relY * curr.tangentY) / (Math.sqrt(segLenSq) * 0.5);
  const clampedOffset = Math.max(-0.5, Math.min(0.5, projOffset));
  const refinedProgress = normalizeProgress(
    (bestIdx + clampedOffset) / SAMPLE_COUNT
  );
  const refinedSample = getTrackPointAtProgress(refinedProgress);

  const dx = x - refinedSample.x;
  const dy = y - refinedSample.y;
  const distanceFromCenter = Math.hypot(dx, dy);
  const signedLateralOffset =
    dx * refinedSample.normalX + dy * refinedSample.normalY;

  return {
    progress: refinedProgress,
    distanceFromCenter,
    signedLateralOffset,
    closestPoint: { x: refinedSample.x, y: refinedSample.y },
    roadAngle: refinedSample.angle,
    tangentX: refinedSample.tangentX,
    tangentY: refinedSample.tangentY,
  };
}

export interface DriverProjection {
  camX: number;
  camZ: number;
  screenX: number;
  screenY: number;
  scale: number;
  visible: boolean;
}

export function projectWorldToDriverCamera(
  wx: number,
  wy: number,
  worldHeight: number,
  cameraX: number,
  cameraY: number,
  cameraAngle: number,
  screenWidth: number,
  screenHeight: number,
  focalLength = 420,
  cameraElevation = 74,
  horizonYRatio = 0.4
): DriverProjection {
  const dx = wx - cameraX;
  const dy = wy - cameraY;

  const fx = Math.cos(cameraAngle);
  const fy = Math.sin(cameraAngle);

  const rx = -fy;
  const ry = fx;

  const camZ = dx * fx + dy * fy;
  const camX = dx * rx + dy * ry;

  if (camZ <= 8) {
    return {
      camX,
      camZ,
      screenX: screenWidth * 0.5,
      screenY: screenHeight,
      scale: 0,
      visible: false,
    };
  }

  const scale = focalLength / camZ;
  const horizonY = screenHeight * horizonYRatio;
  const screenX = screenWidth * 0.5 + camX * scale;
  const screenY = horizonY + (cameraElevation - worldHeight) * scale;

  return {
    camX,
    camZ,
    screenX,
    screenY,
    scale,
    visible: camZ > 8 && camZ < 1650,
  };
}
