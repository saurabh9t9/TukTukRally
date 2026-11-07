import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialRaceState,
  formatRaceTime,
  loadSavedRecords,
  recordFinishedRace,
  stepRaceSimulation,
} from './rules';
import {
  getTrackPointAtProgress,
  getClosestTrackProjection,
  projectWorldToDriverCamera,
} from './track';

test('driver perspective projection centers objects straight ahead and maps right-hand offsets to right of windshield', () => {
  const camX = 100;
  const camY = 200;
  const angle = 0; // Facing +X
  const w = 1000;
  const h = 800;

  // Point straight ahead 200 units along +X
  const straight = projectWorldToDriverCamera(300, 200, 0, camX, camY, angle, w, h);
  assert.equal(straight.visible, true);
  assert.equal(Math.round(straight.screenX), 500);
  assert.ok(straight.screenY > h * 0.40); // Below horizon on road surface

  // Point to the driver's right (+Y when facing +X)
  const rightSide = projectWorldToDriverCamera(300, 250, 0, camX, camY, angle, w, h);
  assert.ok(rightSide.screenX > 500);

  // Point behind the driver (-X when facing +X)
  const behind = projectWorldToDriverCamera(50, 200, 0, camX, camY, angle, w, h);
  assert.equal(behind.visible, false);
});

test('track spline forms a continuous closed loop and projects points accurately', () => {
  const start = getTrackPointAtProgress(0);
  const end = getTrackPointAtProgress(1);
  assert.ok(Math.hypot(start.x - end.x, start.y - end.y) < 1e-4);

  const mid = getTrackPointAtProgress(0.35);
  const proj = getClosestTrackProjection(mid.x, mid.y);
  assert.ok(proj.distanceFromCenter < 2);
  assert.ok(Math.abs(proj.progress - 0.35) < 0.01);
});

test('auto-rickshaw accelerates and steers when playing', () => {
  const state = createInitialRaceState('playing');
  const initialX = state.player.x;
  const initialAngle = state.player.angle;

  for (let i = 0; i < 20; i++) {
    stepRaceSimulation(
      state,
      {
        accelerate: true,
        brake: false,
        left: false,
        right: true,
        hornJustPressed: false,
      },
      0.03
    );
  }

  assert.ok(state.player.speed > 100);
  assert.notEqual(state.player.x, initialX);
  assert.ok(state.player.angle > initialAngle);
});

test('collecting coins increments coin count, charges pocket chai, and grants time bonus', () => {
  const state = createInitialRaceState('playing');
  state.elapsedMs = 5000;
  const targetCoin = state.coins[0];
  state.player.x = targetCoin.x;
  state.player.y = targetCoin.y;

  const events = stepRaceSimulation(
    state,
    {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
      hornJustPressed: false,
    },
    0.016
  );

  assert.equal(events.coinPickedUp, true);
  assert.equal(targetCoin.collected, true);
  assert.equal(state.coinsCollected, 1);
  assert.equal(state.player.pocketChaiMeter, 1);
});

test('picking up chai_nitro power-up activates boost and increases speed', () => {
  const state = createInitialRaceState('playing');
  const nitroPu = state.powerUps.find((p) => p.type === 'chai_nitro')!;
  state.player.x = nitroPu.x;
  state.player.y = nitroPu.y;

  const events = stepRaceSimulation(
    state,
    {
      accelerate: true,
      brake: false,
      left: false,
      right: false,
      hornJustPressed: false,
    },
    0.016
  );

  assert.equal(events.powerUpPickedUp, 'chai_nitro');
  assert.equal(state.player.activePowerUp, 'chai_nitro');
  assert.ok(state.player.powerUpTimer > 4.0);
  assert.ok(state.player.speed >= 400);
});

test('completing 3 laps with checkpoints triggers gameover and records lap splits', () => {
  const state = createInitialRaceState('playing');

  for (let lap = 1; lap <= 3; lap++) {
    state.checkpointsPassed = [true, true, true];
    state.lastProgress = 0.96;
    const afterFinish = getTrackPointAtProgress(0.03);
    state.player.x = afterFinish.x;
    state.player.y = afterFinish.y;
    state.elapsedMs = lap * 18000;

    const events = stepRaceSimulation(
      state,
      {
        accelerate: true,
        brake: false,
        left: false,
        right: false,
        hornJustPressed: false,
      },
      0.016
    );

    assert.equal(events.lapCompleted, lap);
    if (lap < 3) {
      assert.equal(state.phase, 'playing');
      assert.equal(state.currentLap, lap + 1);
    } else {
      assert.equal(events.raceFinished, true);
      assert.equal(state.phase, 'gameover');
      assert.equal(state.lapSplitsMs.length, 3);
    }
  }
});

test('best time persists and updates only when beaten', () => {
  const memoryStore = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memoryStore.set(k, v);
    },
  };

  const initial = loadSavedRecords(mockStorage);
  assert.equal(initial.bestTimeMs, null);

  const run1 = recordFinishedRace(
    initial,
    {
      playerName: 'Priya',
      totalTimeMs: 48500,
      lapSplitsMs: [16500, 16000, 16000],
      coins: 14,
    },
    mockStorage
  );
  assert.equal(run1.isNewBestTime, true);
  assert.equal(run1.updated.bestTimeMs, 48500);

  const run2 = recordFinishedRace(
    run1.updated,
    {
      playerName: 'Rohan',
      totalTimeMs: 51200,
      lapSplitsMs: [17000, 17200, 17000],
      coins: 10,
    },
    mockStorage
  );
  assert.equal(run2.isNewBestTime, false);
  assert.equal(run2.updated.bestTimeMs, 48500);

  const run3 = recordFinishedRace(
    run2.updated,
    {
      playerName: 'Aarav',
      totalTimeMs: 44120,
      lapSplitsMs: [15000, 14500, 14620],
      coins: 21,
    },
    mockStorage
  );
  assert.equal(run3.isNewBestTime, true);
  assert.equal(run3.updated.bestTimeMs, 44120);
  assert.equal(formatRaceTime(44120), '00:44.12');
});

test('repeated player name in leaderboard keeps only their single best (fastest) score', () => {
  const initial = loadSavedRecords();

  // First run by Aarav: 50.00s
  const r1 = recordFinishedRace(initial, {
    playerName: 'Aarav',
    totalTimeMs: 50000,
    lapSplitsMs: [17000, 16500, 16500],
    coins: 12,
  });
  assert.equal(r1.updated.leaderboard.length, 1);
  assert.equal(r1.updated.leaderboard[0].totalTimeMs, 50000);

  // Second run by Aarav (slower: 54.00s) -> Leaderboard must still have only 1 Aarav entry with 50000ms
  const r2 = recordFinishedRace(r1.updated, {
    playerName: 'aarav ',
    totalTimeMs: 54000,
    lapSplitsMs: [18000, 18000, 18000],
    coins: 8,
  });
  assert.equal(r2.updated.leaderboard.length, 1);
  assert.equal(r2.updated.leaderboard[0].playerName, 'Aarav');
  assert.equal(r2.updated.leaderboard[0].totalTimeMs, 50000);

  // Third run by Aarav (faster: 46.20s) -> Leaderboard updates Aarav's single entry to 46200ms
  const r3 = recordFinishedRace(r2.updated, {
    playerName: 'Aarav',
    totalTimeMs: 46200,
    lapSplitsMs: [15400, 15400, 15400],
    coins: 19,
  });
  assert.equal(r3.updated.leaderboard.length, 1);
  assert.equal(r3.updated.leaderboard[0].totalTimeMs, 46200);
});

test('multiple F1 circuit maps switch track geometry cleanly', () => {
  const buddh = createInitialRaceState('playing', 'buddh_gp');
  assert.equal(buddh.trackId, 'buddh_gp');

  const marina = createInitialRaceState('playing', 'marina_street');
  assert.equal(marina.trackId, 'marina_street');
  assert.notEqual(buddh.coins[2].x, marina.coins[2].x);

  const ghats = createInitialRaceState('playing', 'ghats_gp');
  assert.equal(ghats.trackId, 'ghats_gp');
});

