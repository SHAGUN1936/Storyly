/**
 * Web-Audio helpers for the Music Engine editor (decode + waveform peaks +
 * energy-based "best segment" detection). Editor-only — playback on the page
 * is driven by useStoryMusic via the plain <audio> element (no CORS needed).
 */
let _ctx = null;
function ctx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _ctx = new AC();
  }
  return _ctx;
}

/** Decode a File/Blob or a URL into an AudioBuffer. URLs need CORS on the host
 *  (uploaded files are same-origin, so they always work; some CDNs may not). */
export async function decodeAudio(srcOrFile) {
  let bytes;
  if (srcOrFile instanceof Blob) {
    bytes = await srcOrFile.arrayBuffer();
  } else {
    const res = await fetch(srcOrFile, { mode: 'cors' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    bytes = await res.arrayBuffer();
  }
  return ctx().decodeAudioData(bytes.slice(0));
}

/** Per-bucket normalized peak amplitudes (0..1) for drawing the waveform. */
export function computePeaks(buffer, buckets = 700) {
  const channels = buffer.numberOfChannels;
  const data = [];
  for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));
  const len = buffer.length;
  const per = Math.max(1, Math.floor(len / buckets));
  const peaks = new Float32Array(buckets);
  let max = 0;
  for (let i = 0; i < buckets; i++) {
    const s = i * per;
    const e = Math.min(len, s + per);
    let peak = 0;
    for (let j = s; j < e; j++) {
      let sum = 0;
      for (let c = 0; c < channels; c++) sum += data[c][j];
      const v = Math.abs(sum / channels);
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }
  if (max > 0) for (let i = 0; i < buckets; i++) peaks[i] /= max;
  return peaks;
}

/** Find the most energetic segment of `lengthSec` (≈ the chorus / drop) using a
 *  sliding RMS-energy window over 0.5s frames. Returns the start time (sec). */
export function detectBestSegment(buffer, lengthSec) {
  const dur = buffer.duration;
  if (!lengthSec || lengthSec >= dur) return 0;
  const sr = buffer.sampleRate;
  const ch0 = buffer.getChannelData(0);
  const frame = Math.max(1, Math.floor(sr * 0.5));
  const frames = Math.floor(buffer.length / frame);
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const s = f * frame;
    let sum = 0;
    for (let j = 0; j < frame; j++) { const v = ch0[s + j]; sum += v * v; }
    energy[f] = Math.sqrt(sum / frame);
  }
  const win = Math.max(1, Math.round(lengthSec / 0.5));
  let best = 0;
  let bestSum = -1;
  let run = 0;
  for (let f = 0; f < frames; f++) {
    run += energy[f];
    if (f >= win) run -= energy[f - win];
    if (f >= win - 1 && run > bestSum) { bestSum = run; best = (f - win + 1) * 0.5; }
  }
  return Math.max(0, Math.min(dur - lengthSec, best));
}

export const fmtTime = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};
