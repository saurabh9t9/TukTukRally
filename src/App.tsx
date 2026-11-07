/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialRaceState,
  formatRaceTime,
  GamePhase,
  loadSavedRecords,
  RaceSessionState,
  recordFinishedRace,
  SavedRecords,
  stepRaceSimulation,
} from './game/rules';
import { CameraMode, WorldRenderer } from './game/renderer';
import { setActiveTrack, TrackMapId } from './game/track';
import { soundEngine } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HudSnapshot, PlayingHUD } from './components/PlayingHUD';
import { FinishedRunSummary, StatusModals } from './components/StatusModals';
import { PWAInstallModal } from './components/PWAInstallModal';
import {
  MobileOrientationGuard,
  tryEnterFullscreenAndLandscape,
} from './components/MobileOrientationGuard';
import { usePWAInstall } from './utils/usePWAInstall';

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [records, setRecords] = useState<SavedRecords>(() => loadSavedRecords());
  const [currentRacer, setCurrentRacer] = useState<string>(
    () => loadSavedRecords().lastPlayerName
  );
  const [selectedTrackId, setSelectedTrackId] =
    useState<TrackMapId>('buddh_gp');
  const [phase, setPhase] = useState<GamePhase>(
    initialAutostart ? 'playing' : 'title'
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [cameraMode, setCameraMode] = useState<CameraMode>('straight');
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [finishedSummary, setFinishedSummary] =
    useState<FinishedRunSummary | null>(null);

  const [hud, setHud] = useState<HudSnapshot>({
    currentLap: 1,
    coinsCollected: 0,
    pocketChaiMeter: 0,
    activePowerUp: null,
    hasShield: false,
    statusBannerText: null,
    statusBannerColor: '#FACC15',
  });

  const { canNativePrompt, isInstalled, isIOS, isOnline, promptInstall } =
    usePWAInstall();

  // Refs for 60Hz loop decoupling
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerTextRef = useRef<HTMLDivElement | null>(null);
  const speedTextRef = useRef<HTMLSpanElement | null>(null);
  const minimapDotRef = useRef<SVGCircleElement | null>(null);

  const selectedTrackIdRef = useRef<TrackMapId>('buddh_gp');
  const simRef = useRef<RaceSessionState>(
    createInitialRaceState(initialAutostart ? 'playing' : 'title', 'buddh_gp')
  );
  const rendererRef = useRef<WorldRenderer | null>(null);
  const currentRacerRef = useRef<string>(currentRacer);
  const recordsRef = useRef<SavedRecords>(records);

  useEffect(() => {
    currentRacerRef.current = currentRacer;
  }, [currentRacer]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const handleSelectTrack = useCallback((trackId: TrackMapId) => {
    setSelectedTrackId(trackId);
    selectedTrackIdRef.current = trackId;
    setActiveTrack(trackId);
    simRef.current = createInitialRaceState(simRef.current.phase, trackId);
    rendererRef.current?.rebuildSceneryForActiveTrack();
  }, []);

  // Unified Keyboard & Touch Input Hub
  const keysHeldRef = useRef<Set<string>>(new Set());
  const touchHeldRef = useRef<{
    accelerate: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
  }>({
    accelerate: false,
    brake: false,
    left: false,
    right: false,
  });
  const hornJustPressedRef = useRef<boolean>(false);

  const syncBodyPhase = useCallback((nextPhase: GamePhase) => {
    if (typeof document !== 'undefined') {
      document.body.dataset.state = nextPhase;
    }
    setPhase(nextPhase);
  }, []);

  const clearHeldInputs = useCallback(() => {
    keysHeldRef.current.clear();
    touchHeldRef.current = {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
    };
    hornJustPressedRef.current = false;
  }, []);

  const startNewRace = useCallback(() => {
    clearHeldInputs();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      void tryEnterFullscreenAndLandscape();
    }
    setActiveTrack(selectedTrackIdRef.current);
    const fresh = createInitialRaceState('playing', selectedTrackIdRef.current);
    simRef.current = fresh;
    rendererRef.current?.rebuildSceneryForActiveTrack();
    setFinishedSummary(null);
    setHud({
      currentLap: 1,
      coinsCollected: 0,
      pocketChaiMeter: 0,
      activePowerUp: null,
      hasShield: false,
      statusBannerText: 'LAP 1 / 3 — GO!',
      statusBannerColor: '#4ADE80',
    });
    syncBodyPhase('playing');
    soundEngine.playHorn();
  }, [clearHeldInputs, syncBodyPhase]);

  const handlePauseToggle = useCallback(() => {
    const curr = simRef.current.phase;
    if (curr === 'playing') {
      clearHeldInputs();
      simRef.current.phase = 'paused';
      syncBodyPhase('paused');
    } else if (curr === 'paused') {
      clearHeldInputs();
      simRef.current.phase = 'playing';
      syncBodyPhase('playing');
    }
  }, [clearHeldInputs, syncBodyPhase]);

  const handleReturnToTitle = useCallback(() => {
    clearHeldInputs();
    const titleSim = createInitialRaceState('title', selectedTrackIdRef.current);
    simRef.current = titleSim;
    setFinishedSummary(null);
    syncBodyPhase('title');
  }, [clearHeldInputs, syncBodyPhase]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleCycleCameraMode = useCallback(() => {
    if (rendererRef.current) {
      const next = rendererRef.current.cycleCameraMode();
      setCameraMode(next);
    }
  }, []);

  const handleTouchControlChange = useCallback(
    (
      control: 'accelerate' | 'brake' | 'left' | 'right',
      pressed: boolean
    ) => {
      touchHeldRef.current[control] = pressed;
    },
    []
  );

  const handleTouchHorn = useCallback(() => {
    hornJustPressedRef.current = true;
  }, []);

  // Expose deterministic test helper on window for verification if needed
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__autoRallySim = simRef;
  }, []);

  // Mount Canvas & 60Hz Loop Once
  useEffect(() => {
    document.body.dataset.state = initialAutostart ? 'playing' : 'title';
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new WorldRenderer();
    rendererRef.current = renderer;

    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if typing in friend name input
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const code = e.code;
      const currentPhase = simRef.current.phase;

      if (code === 'KeyM') {
        e.preventDefault();
        const nextMuted = soundEngine.toggleMute();
        setIsMuted(nextMuted);
        return;
      }

      if (code === 'KeyC') {
        e.preventDefault();
        const nextCam = renderer.cycleCameraMode();
        setCameraMode(nextCam);
        return;
      }

      if (currentPhase === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startNewRace();
        }
        return;
      }

      if (currentPhase === 'gameover') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startNewRace();
        }
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        handlePauseToggle();
        return;
      }

      if (code === 'KeyR' && currentPhase === 'playing') {
        e.preventDefault();
        startNewRace();
        return;
      }

      if (code === 'Space' && !e.repeat) {
        e.preventDefault();
        hornJustPressedRef.current = true;
      }

      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'KeyW' ||
        code === 'KeyS' ||
        code === 'KeyA' ||
        code === 'KeyD'
      ) {
        e.preventDefault();
        keysHeldRef.current.add(code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onBlurOrVisibility = () => {
      clearHeldInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurOrVisibility);
    document.addEventListener('visibilitychange', onBlurOrVisibility);

      let rafId = 0;
    let cancelled = false;
    let lastTime = performance.now();

    const frame = (now: number) => {
      if (cancelled) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.04);
      const timeSec = now / 1000;

      const sim = simRef.current;

      if (sim.phase === 'playing') {
        const keys = keysHeldRef.current;
        const touch = touchHeldRef.current;

        const input = {
          accelerate:
            keys.has('ArrowUp') || keys.has('KeyW') || touch.accelerate,
          brake: keys.has('ArrowDown') || keys.has('KeyS') || touch.brake,
          left: keys.has('ArrowLeft') || keys.has('KeyA') || touch.left,
          right: keys.has('ArrowRight') || keys.has('KeyD') || touch.right,
          hornJustPressed: hornJustPressedRef.current,
        };
        hornJustPressedRef.current = false;

        const prevLap = sim.currentLap;
        const prevCoins = sim.coinsCollected;
        const prevChai = sim.player.pocketChaiMeter;
        const prevPowerUp = sim.player.activePowerUp;
        const prevShield = sim.player.hasShield;
        const prevBanner = sim.statusBanner?.text ?? null;

        const events = stepRaceSimulation(sim, input, dt);

        // Trigger procedural audio & particle bursts for events
        const isNitro =
          sim.player.activePowerUp === 'chai_nitro' &&
          sim.player.powerUpTimer > 0;
        soundEngine.updateEnginePurr(dt, sim.player.speed, isNitro);

        if (events.hornHonked) {
          soundEngine.playHorn();
        }
        if (events.pocketBoostTriggered) {
          soundEngine.playPowerUp();
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            22,
            '#F97316',
            180,
            7
          );
        }
        if (events.coinPickedUp) {
          soundEngine.playCoin();
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            8,
            '#FACC15',
            115,
            5
          );
        }
        if (events.powerUpPickedUp) {
          soundEngine.playPowerUp();
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            18,
            '#4ADE80',
            160,
            6
          );
        }
        if (events.shieldBroken) {
          soundEngine.playHit('shield');
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            16,
            '#38BDF8',
            150,
            6
          );
        }
        if (events.obstacleHit) {
          soundEngine.playHit(events.obstacleHit);
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            16,
            events.obstacleHit === 'puddle' ? '#38BDF8' : '#EF4444',
            140,
            6
          );
        }
        if (events.lapCompleted !== null) {
          soundEngine.playLapComplete(events.raceFinished);
          renderer.spawnBurst(
            sim.player.x,
            sim.player.y,
            28,
            '#FEF08A',
            210,
            7
          );
        }

        if (events.raceFinished) {
          const result = recordFinishedRace(recordsRef.current, {
            playerName: currentRacerRef.current,
            totalTimeMs: sim.elapsedMs,
            lapSplitsMs: sim.lapSplitsMs,
            coins: sim.coinsCollected,
            trackId: selectedTrackIdRef.current,
          });
          setRecords(result.updated);
          setFinishedSummary({
            playerName: currentRacerRef.current,
            totalTimeMs: sim.elapsedMs,
            lapSplitsMs: [...sim.lapSplitsMs],
            coins: sim.coinsCollected,
            timeBonusMs: sim.timeBonusMs,
            isNewBestTime: result.isNewBestTime,
            isNewBestLap: result.isNewBestLap,
          });
          syncBodyPhase('gameover');
        } else {
          // Mutate high-frequency DOM nodes directly via ref
          if (timerTextRef.current) {
            timerTextRef.current.textContent = formatRaceTime(sim.elapsedMs);
          }
          if (speedTextRef.current) {
            speedTextRef.current.textContent = String(
              Math.round(Math.abs(sim.player.speed) * 0.18)
            );
          }
          if (minimapDotRef.current) {
            minimapDotRef.current.setAttribute(
              'cx',
              String(Math.round(sim.player.x))
            );
            minimapDotRef.current.setAttribute(
              'cy',
              String(Math.round(sim.player.y))
            );
          }

          // Only update React HUD state when discrete values change
          const nextBanner = sim.statusBanner?.text ?? null;
          if (
            prevLap !== sim.currentLap ||
            prevCoins !== sim.coinsCollected ||
            prevChai !== sim.player.pocketChaiMeter ||
            prevPowerUp !== sim.player.activePowerUp ||
            prevShield !== sim.player.hasShield ||
            prevBanner !== nextBanner
          ) {
            setHud({
              currentLap: sim.currentLap,
              coinsCollected: sim.coinsCollected,
              pocketChaiMeter: sim.player.pocketChaiMeter,
              activePowerUp: sim.player.activePowerUp,
              hasShield: sim.player.hasShield,
              statusBannerText: nextBanner,
              statusBannerColor: sim.statusBanner?.color ?? '#FACC15',
            });
          }
        }
      }

      renderer.updateVisualEffects(sim, dt, timeSec);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      renderer.render(
        ctx,
        window.innerWidth,
        window.innerHeight,
        sim,
        timeSec
      );
      ctx.restore();

      if (!cancelled) {
        rafId = window.requestAnimationFrame(frame);
      }
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurOrVisibility);
      document.removeEventListener('visibilitychange', onBlurOrVisibility);
      renderer.dispose();
    };
  }, [clearHeldInputs, handlePauseToggle, initialAutostart, startNewRace, syncBodyPhase]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#18120B] select-none">
      {/* Isolated Full-Viewport Game Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block h-full w-full"
      />

      {/* Title Screen Stage */}
      {phase === 'title' && (
        <TitleScreen
          records={records}
          currentRacer={currentRacer}
          onSelectRacer={setCurrentRacer}
          selectedTrackId={selectedTrackId}
          onSelectTrack={handleSelectTrack}
          onStartRace={startNewRace}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenInstallModal={() => setShowInstallModal(true)}
          isOffline={!isOnline}
        />
      )}

      {/* Active Playing HUD */}
      {(phase === 'playing' || phase === 'paused') && (
        <PlayingHUD
          hud={hud}
          bestTimeMs={records.bestTimeMs}
          currentRacer={currentRacer}
          isMuted={isMuted}
          cameraMode={cameraMode}
          onCycleCameraMode={handleCycleCameraMode}
          onToggleMute={handleToggleMute}
          onPause={handlePauseToggle}
          onRestart={startNewRace}
          timerTextRef={timerTextRef}
          speedTextRef={speedTextRef}
          minimapDotRef={minimapDotRef}
          onTouchControlChange={handleTouchControlChange}
          onTouchHorn={handleTouchHorn}
        />
      )}

      {/* Pause & 3-Lap Victory Modals */}
      <StatusModals
        phase={phase}
        currentLap={hud.currentLap}
        elapsedMs={simRef.current.elapsedMs}
        coinsCollected={hud.coinsCollected}
        summary={finishedSummary}
        records={records}
        nextRacer={currentRacer}
        onSelectNextRacer={setCurrentRacer}
        onResume={handlePauseToggle}
        onRestart={startNewRace}
        onReturnToTitle={handleReturnToTitle}
      />

      {/* Mobile Portrait Rotate-Device Prompt, Auto-Fullscreen & iPhone Offline PWA Guide */}
      <MobileOrientationGuard
        isIOS={isIOS}
        isInstalled={isInstalled}
        isOnline={isOnline}
        canNativePrompt={canNativePrompt}
        onTriggerNativeInstall={() => {
          void promptInstall();
        }}
      />

      {/* iPhone & Android Offline PWA Install Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        canNativePrompt={canNativePrompt}
        isIOS={isIOS}
        isInstalled={isInstalled}
        onTriggerNativeInstall={() => {
          void promptInstall();
        }}
      />
    </main>
  );
}
