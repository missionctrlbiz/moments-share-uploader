import { Howl } from "howler";

type SoundName =
  | "click"
  | "send"
  | "success"
  | "error"
  | "pop"
  | "whoosh"
  | "notification"
  | "typing"
  | "confetti"
  | "navigate";

const audioCtx = typeof window !== "undefined" ? new AudioContext() : null;

function ensureCtx() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.15,
  ramp = true
) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  if (ramp) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, gainValue = 0.05) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

const soundGenerators: Record<SoundName, () => void> = {
  click: () => {
    playTone(800, 0.08, "sine", 0.12);
    setTimeout(() => playTone(600, 0.05, "sine", 0.08), 30);
  },

  send: () => {
    playTone(400, 0.15, "sine", 0.1);
    setTimeout(() => playTone(600, 0.15, "sine", 0.1), 80);
    setTimeout(() => playTone(800, 0.2, "sine", 0.12), 160);
  },

  success: () => {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 100);
    setTimeout(() => playTone(784, 0.15, "sine", 0.12), 200);
    setTimeout(() => playTone(1047, 0.3, "sine", 0.15), 300);
  },

  error: () => {
    playTone(200, 0.2, "sawtooth", 0.08);
    setTimeout(() => playTone(150, 0.3, "sawtooth", 0.06), 150);
  },

  pop: () => {
    playTone(600, 0.06, "sine", 0.2);
    playNoise(0.04, 0.08);
  },

  whoosh: () => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    playNoise(0.2, 0.06);
  },

  notification: () => {
    playTone(880, 0.12, "sine", 0.1);
    setTimeout(() => playTone(1100, 0.2, "sine", 0.12), 120);
  },

  typing: () => {
    playTone(1200 + Math.random() * 400, 0.03, "square", 0.04);
    playNoise(0.02, 0.03);
  },

  confetti: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(600 + Math.random() * 800, 0.1, "sine", 0.08);
        playNoise(0.05, 0.04);
      }, i * 60);
    }
    setTimeout(() => {
      playTone(1047, 0.4, "sine", 0.15);
      playTone(1319, 0.4, "triangle", 0.1);
    }, 300);
  },

  navigate: () => {
    playTone(500, 0.08, "sine", 0.08);
    setTimeout(() => playTone(700, 0.1, "sine", 0.08), 50);
  },
};

const soundCache: Record<string, Howl> = {};

function createHowlFromGenerator(name: SoundName): Howl {
  const ctx = ensureCtx();
  if (!ctx) {
    return new Howl({ src: [""] });
  }

  const sampleRate = ctx.sampleRate;
  const duration = name === "confetti" ? 0.8 : name === "success" ? 0.6 : 0.4;
  const bufferLength = Math.ceil(sampleRate * duration);
  const offlineCtx = new OfflineAudioContext(1, bufferLength, sampleRate);

  const tempCtx = audioCtx;
  const sounds = getOfflineSoundData(name, offlineCtx, sampleRate, duration);

  return new Howl({
    src: [sounds],
    format: ["wav"],
  });
}

function getOfflineSoundData(
  name: SoundName,
  offlineCtx: OfflineAudioContext,
  sampleRate: number,
  duration: number
): string {
  const bufferLength = Math.ceil(sampleRate * duration);
  const buffer = offlineCtx.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);

  switch (name) {
    case "click":
      addTone(data, sampleRate, 800, 0, 0.08, 0.12);
      addTone(data, sampleRate, 600, 0.03, 0.05, 0.08);
      break;
    case "send":
      addTone(data, sampleRate, 400, 0, 0.15, 0.1);
      addTone(data, sampleRate, 600, 0.08, 0.15, 0.1);
      addTone(data, sampleRate, 800, 0.16, 0.2, 0.12);
      break;
    case "success":
      addTone(data, sampleRate, 523, 0, 0.15, 0.12);
      addTone(data, sampleRate, 659, 0.1, 0.15, 0.12);
      addTone(data, sampleRate, 784, 0.2, 0.15, 0.12);
      addTone(data, sampleRate, 1047, 0.3, 0.3, 0.15);
      break;
    case "error":
      addTone(data, sampleRate, 200, 0, 0.2, 0.08, "sawtooth");
      addTone(data, sampleRate, 150, 0.15, 0.3, 0.06, "sawtooth");
      break;
    case "pop":
      addTone(data, sampleRate, 600, 0, 0.06, 0.2);
      break;
    case "whoosh":
      for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        const freq = t < 0.15 ? 200 + (600 * t) / 0.15 : 800 - (700 * (t - 0.15)) / 0.15;
        const envelope = Math.max(0, 1 - t / duration);
        data[i] = Math.sin(2 * Math.PI * freq * t) * 0.1 * envelope;
      }
      break;
    case "notification":
      addTone(data, sampleRate, 880, 0, 0.12, 0.1);
      addTone(data, sampleRate, 1100, 0.12, 0.2, 0.12);
      break;
    case "typing":
      addTone(data, sampleRate, 1400, 0, 0.03, 0.04);
      break;
    case "confetti":
      for (let i = 0; i < 5; i++) {
        addTone(data, sampleRate, 600 + Math.random() * 800, i * 0.06, 0.1, 0.08);
      }
      addTone(data, sampleRate, 1047, 0.3, 0.4, 0.15);
      addTone(data, sampleRate, 1319, 0.3, 0.4, 0.1, "triangle");
      break;
    case "navigate":
      addTone(data, sampleRate, 500, 0, 0.08, 0.08);
      addTone(data, sampleRate, 700, 0.05, 0.1, 0.08);
      break;
  }

  const wav = audioBufferToWav(buffer);
  return wav;
}

function addTone(
  data: Float32Array,
  sampleRate: number,
  frequency: number,
  startSec: number,
  durationSec: number,
  gainValue: number,
  type: string = "sine"
) {
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.min(
    Math.floor((startSec + durationSec) * sampleRate),
    data.length
  );
  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / sampleRate;
    const envelope = Math.max(0, 1 - t / durationSec);
    let sample = 0;
    if (type === "sine") {
      sample = Math.sin(2 * Math.PI * frequency * t);
    } else if (type === "square") {
      sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
    } else if (type === "sawtooth") {
      sample = 2 * ((frequency * t) % 1) - 1;
    } else if (type === "triangle") {
      sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
    }
    data[i] += sample * gainValue * envelope;
  }
}

function audioBufferToWav(buffer: AudioBuffer): string {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * 2;
  const headerLength = 44;
  const arrayBuffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

let initialized = false;

export function initSounds() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const sounds: SoundName[] = [
    "click", "send", "success", "error", "pop",
    "whoosh", "notification", "typing", "confetti", "navigate",
  ];

  sounds.forEach((name) => {
    try {
      const wav = getOfflineSoundData(
        name,
        new OfflineAudioContext(1, 1, 44100),
        44100,
        name === "confetti" ? 0.8 : 0.4
      );
      soundCache[name] = new Howl({ src: [wav], volume: 0.3 });
    } catch {
      // silent fail
    }
  });
}

export function playSound(name: SoundName, volume = 0.3) {
  if (typeof window === "undefined") return;

  if (soundCache[name]) {
    soundCache[name].volume(volume);
    soundCache[name].play();
    return;
  }

  try {
    soundGenerators[name]();
  } catch {
    // silent fail
  }
}

export const SOUND_NAMES: SoundName[] = [
  "click", "send", "success", "error", "pop",
  "whoosh", "notification", "typing", "confetti", "navigate",
];

export type { SoundName };
