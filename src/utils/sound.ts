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

let bgmIntervalId: ReturnType<typeof setTimeout> | null = null;
let bgmGainNode: GainNode | null = null;

export function playBGM(mode: 'normal' | 'fever' = 'normal'): void {
  if (!bgmEnabled) return;
  stopBGM();
  const ctx = getAudioContext();
  if (!ctx) return;

  const gain = ctx.createGain();
  gain.gain.value = bgmVolume;
  gain.connect(ctx.destination);
  bgmGainNode = gain;

  const bpm = mode === 'fever' ? 140 : 96;
  const beat8th = (60 / bpm) / 2;

  const CHORD_PROGRESSION = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66],
  ];
  const BASS_NOTES = [130.81, 110.00, 87.31, 98.00];
  const MELODY = mode === 'fever'
    ? [1047, 988, 880, 988, 1047, 1047, 1047, 988, 880, 988, 1047, 988, 880, 784, 880, 1047]
    : [523, 494, 440, 494, 523, 523, 523, 494, 440, 494, 523, 494, 440, 392, 440, 523];

  let step = 0;

  const tick = () => {
    const ctx2 = getAudioContext();
    if (!ctx2 || !bgmGainNode) return;
    const t = ctx2.currentTime;
    const beat8 = step % 8;
    const chordIndex = Math.floor(step / 8) % 4;
    const chord = CHORD_PROGRESSION[chordIndex];

    if (beat8 === 0) {
      chord.forEach(freq => {
        const osc = ctx2.createOscillator(); const g = ctx2.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(bgmVolume * 0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + beat8th * 8);
        osc.connect(g); g.connect(ctx2.destination); osc.start(t); osc.stop(t + beat8th * 8.1);
      });
      const bOsc = ctx2.createOscillator(); const bGain = ctx2.createGain();
      bOsc.type = 'sine'; bOsc.frequency.setValueAtTime(BASS_NOTES[chordIndex], t);
      bGain.gain.setValueAtTime(bgmVolume * 0.09, t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + beat8th * 7);
      bOsc.connect(bGain); bGain.connect(ctx2.destination); bOsc.start(t); bOsc.stop(t + beat8th * 8);
    }

    const mOsc = ctx2.createOscillator(); const mGain = ctx2.createGain();
    mOsc.type = 'sine'; mOsc.frequency.setValueAtTime(MELODY[step % MELODY.length], t);
    mGain.gain.setValueAtTime(0, t); mGain.gain.linearRampToValueAtTime(bgmVolume * 0.11, t + 0.02);
    mGain.gain.exponentialRampToValueAtTime(0.001, t + beat8th * 0.85);
    mOsc.connect(mGain); mGain.connect(ctx2.destination); mOsc.start(t); mOsc.stop(t + beat8th);

    const tOsc = ctx2.createOscillator(); const tGain = ctx2.createGain();
    tOsc.type = 'triangle'; tOsc.frequency.setValueAtTime(MELODY[step % MELODY.length] * 2, t);
    tGain.gain.setValueAtTime(bgmVolume * 0.02, t);
    tGain.gain.exponentialRampToValueAtTime(0.001, t + beat8th * 0.4);
    tOsc.connect(tGain); tGain.connect(ctx2.destination); tOsc.start(t); tOsc.stop(t + beat8th * 0.4);

    step++;
  };

  tick();
  bgmIntervalId = setInterval(tick, beat8th * 1000);
}

export function stopBGM(): void {
  if (bgmIntervalId !== null) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
  if (bgmGainNode) {
    try { bgmGainNode.disconnect(); } catch {}
    bgmGainNode = null;
  }
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
