import { Platform } from 'react-native';

// Web Audio API sound engine - only works on web platform
// On native, haptics are used instead (no sound)

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (audioContext) return audioContext;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch {
    return null;
  }
}

/** Ensure AudioContext is resumed (must be called from user gesture on web) */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// ---- Volume control ----
let seVolume = 0.8;
let seEnabled = true;

export function setSEVolume(vol: number) {
  seVolume = Math.max(0, Math.min(1, vol));
}

export function setSEEnabled(enabled: boolean) {
  seEnabled = enabled;
}

// ---- Sound generation helpers ----

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volumeMultiplier: number = 1,
  frequencyEnd?: number,
) {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (frequencyEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + duration / 1000);
  }

  const vol = seVolume * volumeMultiplier * 0.3;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration / 1000);
}

function playNote(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const vol = seVolume * 0.25;
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// ---- Public sound functions ----

/** Drop sound: soft thud (100Hz sine, 100ms) */
export function playDropSound() {
  playTone(100, 100, 'sine', 0.6);
}

/** Merge sound: ascending chime, pitch scales with evolution tier */
export function playMergeSound(evolutionIndex: number) {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Base frequency rises with tier (C4=262 to C6=1047)
  const baseFreq = 262 + evolutionIndex * 80;
  const now = ctx.currentTime;

  // Two-note ascending chime
  playNote(baseFreq, now, 0.12, 'triangle');
  playNote(baseFreq * 1.5, now + 0.08, 0.15, 'triangle');

  // High tiers (6+) get a third sparkle note
  if (evolutionIndex >= 6) {
    playNote(baseFreq * 2, now + 0.15, 0.2, 'sine');
  }
}

/** Landing sound: very subtle tap */
export function playLandSound() {
  playTone(150, 60, 'sine', 0.3);
}

/** Combo sound: rising pitch based on combo count */
export function playComboSound(comboCount: number) {
  const basePitch = 600 + (comboCount - 1) * 100;
  const endPitch = basePitch + 300;
  playTone(basePitch, 120, 'sine', 0.8, endPitch);
}

/** Game over: descending tone */
export function playGameOverSound() {
  playTone(600, 400, 'sawtooth', 0.5, 150);
}

/** Collapse sound: rumble effect */
export function playCollapseSound() {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Low rumble
  playNote(80, now, 0.3, 'sawtooth');
  playNote(60, now + 0.1, 0.3, 'sawtooth');
  // Crash
  playNote(200, now + 0.05, 0.15, 'square');
}
