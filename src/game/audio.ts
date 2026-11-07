const MUTE_STORAGE_KEY = 'auto_rally_muted_v1';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private engineTimer: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
      } catch {
        this.muted = false;
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): boolean {
    this.muted = mute;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, mute ? 'true' : 'false');
      } catch {
        // Ignore storage errors
      }
    }
    return this.muted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public updateEnginePurr(dt: number, speed: number, isNitro: boolean): void {
    if (this.muted) return;
    const absSpeed = Math.abs(speed);
    const interval = Math.max(0.042, 0.13 - (absSpeed / 450) * 0.085);
    this.engineTimer += dt;
    if (this.engineTimer < interval) return;
    this.engineTimer = 0;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Cute 2-stroke tuk-tuk putt-putt harmonic
    osc.type = isNitro ? 'sawtooth' : 'triangle';
    const baseFreq = 68 + Math.min(180, absSpeed * 0.36) + (isNitro ? 45 : 0);
    const jitter = 1 + (Math.random() - 0.5) * 0.06;
    osc.frequency.setValueAtTime(baseFreq * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.035);

    const vol = absSpeed < 8 ? 0.015 : 0.038;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playCoin(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pitchVar = 1 + (Math.random() - 0.5) * 0.12;
    const notes = [987.77, 1318.51]; // B5 -> E6 rupee clink

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * pitchVar, now + idx * 0.055);

      gain.gain.setValueAtTime(0.11, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.17);
    });
  }

  public playHorn(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Classic Indian bulb horn "Pom-Pom!"
    [0, 0.13].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const f = i === 0 ? 440 : 523.25;
      osc.frequency.setValueAtTime(f, now + offset);
      osc.frequency.linearRampToValueAtTime(f * 0.94, now + offset + 0.1);

      gain.gain.setValueAtTime(0.11, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  public playPowerUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.19);
    });
  }

  public playHit(type: 'cow' | 'cart' | 'puddle' | 'cone' | 'shield'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'cow') {
      // Gentle low "Mooo" pitch bend
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'puddle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    }
  }

  public playLapComplete(isFinalVictory: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = isFinalVictory
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
      : [440, 554.37, 659.25, 880];

    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.075);
      gain.gain.setValueAtTime(0.13, now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.28);
    });
  }
}

export const soundEngine = new SoundEngine();
