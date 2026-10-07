import { useSyncExternalStore } from "react";
import { useStore } from "./store";
import { field } from "./field";

// Everything is synthesised with WebAudio — no audio files to download.
// Off by default; the preference is remembered and re-armed on the next gesture.

const KEY = "discovery:sound";
const listeners = new Set();
let ctx = null;
let master = null;
let noise = null;
let room = null; // { filter, gain }
let enabled = false;
let raf = 0;

const emit = () => listeners.forEach((fn) => fn());

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Room tone: filtered noise plus a low mains hum. Dragging opens the filter.
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 260;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  src.connect(filter).connect(gain).connect(master);
  src.start();

  const hum = ctx.createOscillator();
  hum.frequency.value = 55;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.012;
  hum.connect(humGain).connect(master);
  hum.start();

  room = { filter, gain };
}

function follow() {
  if (!enabled) return;
  const s = useStore.getState();
  const speed = s.mode === "field" ? Math.hypot(field.velocity.x, field.velocity.y) : 0;
  const t = ctx.currentTime;
  room.filter.frequency.setTargetAtTime(260 + Math.min(speed, 60) * 45, t, 0.12);
  room.gain.gain.setTargetAtTime(0.05 + Math.min(speed, 60) * 0.0016, t, 0.12);
  raf = requestAnimationFrame(follow);
}

function burst({ at = 0, freq, q = 1, type = "bandpass", peak, length }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(filter).connect(gain).connect(master);
  src.start(t, Math.random() * 1.5, length + 0.05);
}

function tone({ at = 0, from, to = from, type = "sine", peak, length }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

function sweep({ length = 1.1, peak = 0.16, from = 300, mid = 2400 }) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(mid, t + length * 0.45);
  filter.frequency.exponentialRampToValueAtTime(from, t + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + length * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(filter).connect(gain).connect(master);
  src.start(t, Math.random(), length + 0.1);
}

const SOUNDS = {
  // Focal-plane shutter: two curtains, then the mirror's thud.
  shutter: () => {
    burst({ freq: 4200, q: 1.2, peak: 0.5, length: 0.04 });
    burst({ at: 0.055, freq: 2600, q: 1, peak: 0.38, length: 0.05 });
    tone({ from: 150, to: 55, peak: 0.25, length: 0.09 });
  },
  tick: () => tone({ from: 2300, to: 1800, type: "triangle", peak: 0.035, length: 0.035 }),
  keep: () => {
    tone({ from: 880, peak: 0.06, length: 0.12 });
    tone({ at: 0.07, from: 1320, peak: 0.05, length: 0.22 });
  },
  whoosh: () => sweep({}),
  swipe: () => sweep({ length: 0.5, peak: 0.1, from: 600, mid: 3200 }),
};

function enable() {
  if (!ctx) setup();
  ctx.resume();
  enabled = true;
  master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.4);
  cancelAnimationFrame(raf);
  follow();
  persist(true);
  emit();
}

function disable() {
  enabled = false;
  cancelAnimationFrame(raf);
  if (ctx) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => !enabled && ctx.suspend(), 600);
  }
  persist(false);
  emit();
}

function persist(on) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* preference is a nicety */
  }
}

export const sound = {
  toggle: () => (enabled ? disable() : enable()),
  play: (name) => enabled && ctx?.state === "running" && SOUNDS[name]?.(),
};

export const useSoundEnabled = () =>
  useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => enabled
  );

if (typeof window !== "undefined") {
  // Browsers only allow audio after a gesture: re-arm a remembered "on".
  let wanted = false;
  try {
    wanted = localStorage.getItem(KEY) === "1";
  } catch {
    /* ignore */
  }
  if (wanted) {
    window.addEventListener("pointerdown", () => !enabled && enable(), { once: true });
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !enabled) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  // A soft tick whenever the hand finds a new print in the field.
  useStore.subscribe((s, prev) => {
    if (s.hovered !== prev.hovered && s.hovered >= 0) sound.play("tick");
    if (s.generation !== prev.generation && prev.generation > 0) sound.play("whoosh");
  });
}
