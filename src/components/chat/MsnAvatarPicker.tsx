/**
 * @module MsnAvatarPicker
 * Classic MSN "Change Display Picture" dialog with grid + preview panel.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "../ui/button";

// Classic MSN default avatar presets (emoji-based placeholders)
const msnAvatarPresets = [
  { id: "msn-duck", label: "Anka", emoji: "🦆" },
  { id: "msn-cat", label: "Katt", emoji: "🐱" },
  { id: "msn-dog", label: "Hund", emoji: "🐶" },
  { id: "msn-frog", label: "Groda", emoji: "🐸" },
  { id: "msn-owl", label: "Uggla", emoji: "🦉" },
  { id: "msn-panda", label: "Panda", emoji: "🐼" },
  { id: "msn-penguin", label: "Pingvin", emoji: "🐧" },
  { id: "msn-monkey", label: "Apa", emoji: "🐵" },
  { id: "msn-bear", label: "Björn", emoji: "🐻" },
  { id: "msn-rabbit", label: "Kanin", emoji: "🐰" },
  { id: "msn-fox", label: "Räv", emoji: "🦊" },
  { id: "msn-lion", label: "Lejon", emoji: "🦁" },
  { id: "msn-guitar", label: "Gitarr", emoji: "🎸" },
  { id: "msn-soccer", label: "Fotboll", emoji: "⚽" },
  { id: "msn-heart", label: "Hjärta", emoji: "❤️" },
  { id: "msn-star", label: "Stjärna", emoji: "⭐" },
  { id: "msn-flower", label: "Blomma", emoji: "🌸" },
  { id: "msn-sun", label: "Sol", emoji: "☀️" },
  { id: "msn-moon", label: "Måne", emoji: "🌙" },
  { id: "msn-rainbow", label: "Regnbåge", emoji: "🌈" },
  { id: "msn-coffee", label: "Kaffe", emoji: "☕" },
  { id: "msn-pizza", label: "Pizza", emoji: "🍕" },
  { id: "msn-game", label: "Spel", emoji: "🎮" },
  { id: "msn-music", label: "Musik", emoji: "🎵" },
  { id: "msn-camera", label: "Kamera", emoji: "📷" },
  { id: "msn-crown", label: "Krona", emoji: "👑" },
  { id: "msn-rocket", label: "Raket", emoji: "🚀" },
  { id: "msn-butterfly", label: "Fjäril", emoji: "🦋" },
  { id: "msn-ghost", label: "Spöke", emoji: "👻" },
  { id: "msn-alien", label: "Alien", emoji: "👽" },
  { id: "msn-robot", label: "Robot", emoji: "🤖" },
  { id: "msn-unicorn", label: "Enhörning", emoji: "🦄" },
];

interface MsnAvatarPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatarId: string, emoji: string) => void;
  currentAvatarId?: string;
}

export function MsnAvatarPicker({ open, onClose, onSelect, currentAvatarId }: MsnAvatarPickerProps) {
  const [selected, setSelected] = useState(currentAvatarId || msnAvatarPresets[0].id);

  if (!open) return null;

  const selectedPreset = msnAvatarPresets.find(a => a.id === selected) || msnAvatarPresets[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#ece9d8] dark:bg-gray-800 rounded-sm shadow-2xl border border-gray-400 dark:border-gray-600 w-[420px] max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* XP-style title bar */}
        <div className="bg-gradient-to-r from-[#0a246a] via-[#3a6ea5] to-[#0a246a] px-3 py-1.5 flex items-center justify-between rounded-t-sm">
          <span className="text-white text-[12px] font-bold">Byt visningsbild</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 flex-1 overflow-hidden">
          <p className="text-[11px] text-gray-700 dark:text-gray-300 mb-3">
            Välj en bild att visa för dina kontakter:
          </p>

          <div className="flex gap-3">
            {/* Avatar Grid */}
            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-sm p-2 overflow-y-auto max-h-[280px]">
              <div className="grid grid-cols-6 gap-1">
                {msnAvatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelected(preset.id)}
                    className={cn(
                      "w-10 h-10 rounded-sm flex items-center justify-center text-xl border transition-all hover:scale-110",
                      selected === preset.id
                        ? "border-[#316ac5] bg-[#316ac5]/20 ring-1 ring-[#316ac5]"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                    )}
                    title={preset.label}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="w-28 flex flex-col items-center gap-2">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-600 rounded-sm flex items-center justify-center text-5xl">
                {selectedPreset.emoji}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center">
                {selectedPreset.label}
              </span>
            </div>
          </div>
        </div>

        {/* XP-style button bar */}
        <div className="px-3 py-2 bg-[#ece9d8] dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-2 rounded-b-sm">
          <Button
            onClick={() => {
              onSelect(selectedPreset.id, selectedPreset.emoji);
              onClose();
            }}
            className="bg-gradient-to-b from-[#f5f5f5] to-[#dcdcdc] hover:from-[#e8e8e8] hover:to-[#d0d0d0] text-gray-900 text-[11px] border border-gray-400 px-4 h-7 shadow-sm"
          >
            OK
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gradient-to-b from-[#f5f5f5] to-[#dcdcdc] hover:from-[#e8e8e8] hover:to-[#d0d0d0] text-gray-900 text-[11px] border border-gray-400 px-4 h-7 shadow-sm"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
