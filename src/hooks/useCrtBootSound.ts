/**
 * @module useCrtBootSound
 * Synthesizes a CRT monitor power-on sound using Web Audio API.
 * Plays once per session. Persists mute preference in localStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "echo2000_crt_muted";
const PLAYED_KEY = "echo2000_crt_played";

export function useCrtBootSound() {
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const played = useRef(false);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const play = useCallback(() => {
    if (played.current || muted) return;

    played.current = true;

    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.15;
      masterGain.connect(ctx.destination);

      // 1. Low electrical hum (60 Hz buzz)
      const hum = ctx.createOscillator();
      const humGain = ctx.createGain();
      hum.type = "sawtooth";
      hum.frequency.setValueAtTime(60, ctx.currentTime);
      humGain.gain.setValueAtTime(0, ctx.currentTime);
      humGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
      humGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
      humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      hum.connect(humGain);
      humGain.connect(masterGain);
      hum.start(ctx.currentTime);
      hum.stop(ctx.currentTime + 1.2);

      // 2. High-pitch CRT whine (15.7 kHz flyback)
      const whine = ctx.createOscillator();
      const whineGain = ctx.createGain();
      whine.type = "sine";
      whine.frequency.setValueAtTime(12000, ctx.currentTime);
      whine.frequency.exponentialRampToValueAtTime(15700, ctx.currentTime + 0.3);
      whineGain.gain.setValueAtTime(0, ctx.currentTime);
      whineGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.15);
      whineGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.6);
      whineGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      whine.connect(whineGain);
      whineGain.connect(masterGain);
      whine.start(ctx.currentTime);
      whine.stop(ctx.currentTime + 1.5);

      // 3. Static burst (white noise)
      const bufferSize = ctx.sampleRate * 0.3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 3000;
      noiseFilter.Q.value = 0.7;
      noise.buffer = noiseBuffer;
      noiseGain.gain.setValueAtTime(0.5, ctx.currentTime + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(ctx.currentTime + 0.05);

      // 4. Degauss "thunk" (low frequency transient)
      const thunk = ctx.createOscillator();
      const thunkGain = ctx.createGain();
      thunk.type = "sine";
      thunk.frequency.setValueAtTime(120, ctx.currentTime);
      thunk.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
      thunkGain.gain.setValueAtTime(0.6, ctx.currentTime);
      thunkGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      thunk.connect(thunkGain);
      thunkGain.connect(masterGain);
      thunk.start(ctx.currentTime);
      thunk.stop(ctx.currentTime + 0.25);

      // Cleanup
      setTimeout(() => ctx.close(), 2000);
    } catch {
      // Web Audio not supported — fail silently
    }
  }, [muted]);

  return { muted, toggleMute, play };
}
