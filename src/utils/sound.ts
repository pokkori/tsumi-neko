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
let bgmVolume = 0.5;
let bgmEnabled = true;

export function setSEVolume(vol: number) {
  seVolume = Math.max(0, Math.min(1, vol));
}

export function setSEEnabled(enabled: boolean) {
  seEnabled = enabled;
}

export function setBGMVolume(vol: number) {
  bgmVolume = Math.max(0, Math.min(1, vol));
}

export function setBGMEnabled(enabled: boolean) {
  bgmEnabled = enabled;
}

// ---- BGM Engine ----
// C-Am-F-G chord progression loop, 120BPM, 4 bars
// 3-4 OscillatorNodes, triangle + sine waves

let bgmOscillators: OscillatorNode[] = [];
let bgmGains: GainNode[] = [];
let bgmIntervalId: ReturnType<typeof setTimeout> | null = null;
let bgmPlaying = false;

// Chord frequencies (C-Am-F-G progression)
const CHORD_PROGRESSION = [
  // C major: C4, E4, G4
  [261.63, 329.63, 392.00],
  // Am: A3, C4, E4
  [220.00, 261.63, 329.63],
  // F major: F3, A3, C4
  [174.61, 220.00, 261.63],
  // G major: G3, B3, D4
  [196.00, 246.94, 293.66],
];

// 120BPM = 0.5s per beat, 4 beats per bar
const BEAT_DURATION = 0.5; // seconds
const BAR_DURATION = BEAT_DURATION * 4; // 2 seconds per bar

export function playBGM(): void {
  if (!bgmEnabled || bgmPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  bgmPlaying = true;
  let chordIndex = 0;

  const playChord = () => {
    if (!bgmPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Clean up previous oscillators
    stopBGMOscillators();

    const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];
    const now = ctx.currentTime;

    // Create 3-4 oscillators per chord
    // Oscillator 1-3: chord tones (triangle wave)
    for (let i = 0; i < chord.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(chord[i], now);

      const vol = bgmVolume * 0.08;
      gain.gain.setValueAtTime(vol, now);
      // Gentle envelope: attack 0.05s, sustain, release at end
      gain.gain.linearRampToValueAtTime(vol, now + BAR_DURATION * 0.8);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + BAR_DURATION);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + BAR_DURATION + 0.1);

      bgmOscillators.push(osc);
      bgmGains.push(gain);
    }

    // Oscillator 4: bass note (sine wave, one octave lower)
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(chord[0] / 2, now);

    const bassVol = bgmVolume * 0.06;
    bassGain.gain.setValueAtTime(bassVol, now);
    bassGain.gain.linearRampToValueAtTime(bassVol * 0.2, now + BAR_DURATION);

    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + BAR_DURATION + 0.1);

    bgmOscillators.push(bassOsc);
    bgmGains.push(bassGain);

    chordIndex++;
  };

  // Start immediately and loop every bar
  playChord();
  bgmIntervalId = setInterval(playChord, BAR_DURATION * 1000);
}

function stopBGMOscillators(): void {
  for (const osc of bgmOscillators) {
    try { osc.stop(); } catch {}
  }
  bgmOscillators = [];
  bgmGains = [];
}

export function stopBGM(): void {
  bgmPlaying = false;
  if (bgmIntervalId !== null) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
  stopBGMOscillators();
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

/** Merge sound: pitch-shifted "purin" bouncy sound with reverb */
export function playMergeSound(evolutionIndex: number) {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Base frequency rises with tier
  const baseFreq = 400 + evolutionIndex * 60;

  // Oscillator 1: main tone with pitch shift (triangle wave)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(baseFreq, now);
  // Pitch shift up then down for "purin" bounce
  osc1.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.06);
  osc1.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + 0.15);

  const vol1 = seVolume * 0.25;
  gain1.gain.setValueAtTime(vol1, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  // Create ConvolverNode reverb
  const convolver = ctx.createConvolver();
  const reverbLength = ctx.sampleRate * 0.3;
  const reverbBuffer = ctx.createBuffer(1, reverbLength, ctx.sampleRate);
  const reverbData = reverbBuffer.getChannelData(0);
  for (let i = 0; i < reverbLength; i++) {
    reverbData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
  }
  convolver.buffer = reverbBuffer;

  const reverbGain = ctx.createGain();
  reverbGain.gain.setValueAtTime(0.15, now);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  gain1.connect(convolver);
  convolver.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.3);

  // Oscillator 2: sine overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(baseFreq * 2, now);
  osc2.frequency.linearRampToValueAtTime(baseFreq * 2.5, now + 0.05);
  osc2.frequency.linearRampToValueAtTime(baseFreq * 2, now + 0.12);

  gain2.gain.setValueAtTime(vol1 * 0.3, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.25);

  // High tiers (6+) get a sparkle note
  if (evolutionIndex >= 6) {
    playNote(baseFreq * 3, now + 0.12, 0.2, 'sine');
  }
}

/** Landing sound: soft "posu" with lowpass filter (BiquadFilterNode) */
export function playLandSound() {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(100, now + 0.08);

  // BiquadFilterNode lowpass for soft "posu" sound
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.linearRampToValueAtTime(150, now + 0.08);
  filter.Q.setValueAtTime(1, now);

  const vol = seVolume * 0.2;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
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
