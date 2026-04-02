/**
 * Sounds settings tab — toggle individual sounds on/off with preview.
 * Persists to localStorage.
 */
import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { useMsnSounds } from "@/hooks/useMsnSounds";

const STORAGE_KEY = "echo-settings-sounds";

interface SoundToggle {
  id: string;
  label: string;
  description: string;
  soundType: "message" | "nudge" | "online" | "offline" | "send" | "error";
}

const sounds: SoundToggle[] = [
  { id: "msg-received", label: "Nytt meddelande", description: "Spelas när du får ett chattmeddelande", soundType: "message" },
  { id: "msg-sent", label: "Meddelande skickat", description: "Spelas när du skickar ett meddelande", soundType: "send" },
  { id: "nudge", label: "Nudge", description: "Spelas när någon skickar en nudge", soundType: "nudge" },
  { id: "sign-in", label: "Kontakt loggar in", description: "Spelas när en kontakt kommer online", soundType: "online" },
  { id: "sign-out", label: "Kontakt loggar ut", description: "Spelas när en kontakt går offline", soundType: "offline" },
  { id: "error", label: "Felljud", description: "Spelas vid fel (t.ex. meddelande kunde inte skickas)", soundType: "error" },
];

function loadSounds(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return Object.fromEntries(sounds.map((s) => [s.id, true]));
}

export function MsnSettingsSounds() {
  const { playSound } = useMsnSounds();
  const [enabledSounds, setEnabledSounds] = useState<Record<string, boolean>>(loadSounds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledSounds));
  }, [enabledSounds]);

  const toggle = (id: string) => {
    setEnabledSounds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Ljud</h3>
        <p className="msn-settings-hint" style={{ marginBottom: 8 }}>
          Aktivera eller avaktivera individuella ljudeffekter. Klicka på 🔊 för att förhandsgranska.
        </p>

        <div className="space-y-1">
          {sounds.map((sound) => (
            <div key={sound.id} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div
                className="msn-settings-toggle"
                data-checked={enabledSounds[sound.id]}
                onClick={() => toggle(sound.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                  {sound.label}
                </p>
                <p className="text-[10px] text-gray-500">
                  {sound.description}
                </p>
              </div>
              <button
                className="msn-settings-btn flex items-center gap-1"
                style={{ padding: "2px 8px", fontSize: 10 }}
                onClick={() => playSound(sound.soundType)}
                title="Förhandsgranska"
              >
                <Volume2 className="w-3 h-3" />
                🔊
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
