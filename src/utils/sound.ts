import { Platform } from 'react-native';
import {
  hapticsLight, hapticsMedium, hapticsHeavy, hapticsError,
  hapticsCombo, hapticsMerge, hapticsMergeLarge, hapticsCollapse,
} from './haptics';

// Web Audio API sound engine - only works on web platform
// On native, haptics are used as SE replacement

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

// ---- BGM Engine (expo-av MP3) ----
import { Audio } from 'expo-av';

let _bgmNormal: Audio.Sound | null = null;
let _bgmFever: Audio.Sound | null = null;
let _currentBGMMode: 'normal' | 'fever' | null = null;
let _bgmLoaded = false;

export async function loadBGMAsync(): Promise<void> {
  if (_bgmLoaded) return;
  try {
    const { sound: sn } = await Audio.Sound.createAsync(
      require('../../assets/sounds/bgm_normal.mp3'),
      { isLooping: true, volume: 0.5, shouldPlay: false }
    );
    const { sound: sf } = await Audio.Sound.createAsync(
      require('../../assets/sounds/bgm_fever.mp3'),
      { isLooping: true, volume: 0.6, shouldPlay: false }
    );
    _bgmNormal = sn;
    _bgmFever = sf;
    _bgmLoaded = true;
  } catch {
    // MP3ファイル未配置時はスキップ（ビルドエラーにならない）
  }
}

export async function playBGM(mode: 'normal' | 'fever' = 'normal'): Promise<void> {
  if (!bgmEnabled) return;
  if (_currentBGMMode === mode) return;
  await stopBGM();
  _currentBGMMode = mode;
  const sound = mode === 'fever' ? _bgmFever : _bgmNormal;
  if (!sound) return;
  try {
    await sound.setVolumeAsync(bgmVolume);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {}
}

export async function stopBGM(): Promise<void> {
  _currentBGMMode = null;
  try { if (_bgmNormal) await _bgmNormal.stopAsync(); } catch {}
  try { if (_bgmFever) await _bgmFever.stopAsync(); } catch {}
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
  if (Platform.OS !== 'web') { hapticsLight(); return; }
  playTone(100, 100, 'sine', 0.6);
}

/** Merge sound: pitch-shifted "purin" bouncy sound with reverb */
export function playMergeSound(evolutionIndex: number) {
  if (Platform.OS !== 'web') {
    if (evolutionIndex >= 6) hapticsMergeLarge(); else hapticsMerge();
    return;
  }
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
  if (Platform.OS !== 'web') { hapticsLight(); return; }
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
  if (Platform.OS !== 'web') { hapticsCombo(); return; }
  const basePitch = 600 + (comboCount - 1) * 100;
  const endPitch = basePitch + 300;
  playTone(basePitch, 120, 'sine', 0.8, endPitch);
}

/** Game over: descending tone */
export function playGameOverSound() {
  if (Platform.OS !== 'web') { hapticsError(); return; }
  playTone(600, 400, 'sawtooth', 0.5, 150);
}

/** Collapse sound: rumble effect */
export function playCollapseSound() {
  if (Platform.OS !== 'web') { hapticsCollapse(); return; }
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
