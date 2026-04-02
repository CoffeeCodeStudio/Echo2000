import { useCallback, useRef } from "react";

type SoundType = "message" | "nudge" | "online" | "offline" | "send" | "error";

const STORAGE_KEY = "echo-settings-sounds";

/** Map sound types to setting IDs used in MsnSettingsSounds */
const soundTypeToSettingId: Record<SoundType, string> = {
  message: "msg-received",
  send: "msg-sent",
  nudge: "nudge",
  online: "sign-in",
  offline: "sign-out",
  error: "error",
};

function isSoundEnabled(type: SoundType): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true; // default: all on
    const settings = JSON.parse(raw);
    const id = soundTypeToSettingId[type];
    return settings[id] !== false;
  } catch {
    return true;
  }
}

/**
 * Synthesises retro MSN Messenger-style notification sounds via the Web Audio API.
 * Respects per-sound toggle settings stored in localStorage.
 */
export function useMsnSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3,
    delay: number = 0
  ) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    if (!isSoundEnabled(type)) return;
    try {
      switch (type) {
        case "message":
          playTone(880, 0.15, "sine", 0.25, 0);
          playTone(1100, 0.2, "sine", 0.25, 0.12);
          playTone(1320, 0.25, "sine", 0.2, 0.25);
          break;
        case "send":
          playTone(600, 0.08, "sine", 0.15, 0);
          playTone(800, 0.1, "sine", 0.12, 0.05);
          break;
        case "nudge":
          for (let i = 0; i < 6; i++) {
            playTone(150 + (i % 2) * 50, 0.08, "square", 0.15, i * 0.1);
          }
          break;
        case "online":
          playTone(523, 0.15, "sine", 0.2, 0);
          playTone(659, 0.15, "sine", 0.2, 0.1);
          playTone(784, 0.2, "sine", 0.25, 0.2);
          playTone(1047, 0.3, "sine", 0.2, 0.35);
          break;
        case "offline":
          playTone(784, 0.15, "sine", 0.2, 0);
          playTone(659, 0.15, "sine", 0.18, 0.12);
          playTone(523, 0.25, "sine", 0.15, 0.24);
          break;
        case "error":
          playTone(300, 0.15, "square", 0.2, 0);
          playTone(250, 0.2, "square", 0.18, 0.15);
          break;
      }
    } catch (e) {
      console.log("Could not play sound:", e);
    }
  }, [playTone]);

  return { playSound };
}
