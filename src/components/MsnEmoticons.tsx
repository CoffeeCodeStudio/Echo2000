import { useState } from "react";
import { cn } from "@/lib/utils";

// Classic MSN-style emoticons mapped to emoji
export const msnEmoticons: Record<string, { emoji: string; alt: string }> = {
  ":)": { emoji: "😊", alt: "Leende" },
  ":D": { emoji: "😃", alt: "Stort leende" },
  ";)": { emoji: "😉", alt: "Blinkning" },
  ":(": { emoji: "😞", alt: "Ledsen" },
  ":O": { emoji: "😮", alt: "Förvånad" },
  ":P": { emoji: "😛", alt: "Tungan ute" },
  ":S": { emoji: "😕", alt: "Förvirrad" },
  ":'(": { emoji: "😢", alt: "Gråter" },
  ":@": { emoji: "😠", alt: "Arg" },
  "8)": { emoji: "😎", alt: "Cool" },
  ":|": { emoji: "😐", alt: "Neutral" },
  ":$": { emoji: "😳", alt: "Generad" },
  "(H)": { emoji: "😎", alt: "Cool" },
  "(A)": { emoji: "😇", alt: "Ängel" },
  "(L)": { emoji: "❤️", alt: "Hjärta" },
  "(U)": { emoji: "💔", alt: "Krossat hjärta" },
  "(K)": { emoji: "💋", alt: "Kyss" },
  "(G)": { emoji: "🎁", alt: "Present" },
  "(F)": { emoji: "🌹", alt: "Ros" },
  "(W)": { emoji: "🥀", alt: "Vissnad ros" },
  "(P)": { emoji: "📷", alt: "Kamera" },
  "(~)": { emoji: "🎬", alt: "Film" },
  "(T)": { emoji: "📞", alt: "Telefon" },
  "(@)": { emoji: "🐱", alt: "Katt" },
  "(&)": { emoji: "🐶", alt: "Hund" },
  "(I)": { emoji: "💡", alt: "Lampa" },
  "(C)": { emoji: "☕", alt: "Kaffe" },
  "(S)": { emoji: "🌙", alt: "Måne" },
  "(*) ": { emoji: "⭐", alt: "Stjärna" },
  "(#)": { emoji: "☀️", alt: "Sol" },
  "(R)": { emoji: "🌈", alt: "Regnbåge" },
  "(O)": { emoji: "⏰", alt: "Klocka" },
  "(E)": { emoji: "📧", alt: "E-post" },
  "(^)": { emoji: "🎂", alt: "Tårta" },
  "(B)": { emoji: "🍺", alt: "Öl" },
  "(D)": { emoji: "🍸", alt: "Drink" },
  "(Z)": { emoji: "👦", alt: "Pojke" },
  "(X)": { emoji: "👧", alt: "Flicka" },
  "(Y)": { emoji: "👍", alt: "Tummen upp" },
  "(N)": { emoji: "👎", alt: "Tummen ner" },
};

// Quick-access MSN emoticon buttons
export const quickEmoticons = [
  { code: ":)", emoji: "😊" },
  { code: ":D", emoji: "😃" },
  { code: ";)", emoji: "😉" },
  { code: ":(", emoji: "😞" },
  { code: ":P", emoji: "😛" },
  { code: ":O", emoji: "😮" },
  { code: "(L)", emoji: "❤️" },
  { code: "(Y)", emoji: "👍" },
  { code: "(K)", emoji: "💋" },
  { code: "8)", emoji: "😎" },
  { code: ":@", emoji: "😠" },
  { code: ":'(", emoji: "😢" },
  { code: "(H)", emoji: "😎" },
  { code: "(A)", emoji: "😇" },
  { code: "(F)", emoji: "🌹" },
  { code: "(C)", emoji: "☕" },
];

// Convert text with MSN emoticon codes to emoji
export function convertMsnEmoticons(text: string): string {
  let result = text;
  Object.entries(msnEmoticons).forEach(([code, { emoji }]) => {
    // Escape special regex characters
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedCode, 'g'), emoji);
  });
  return result;
}

interface MsnEmoticonPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function MsnEmoticonPicker({ onSelect, className }: MsnEmoticonPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  const emoticonsToShow = showAll ? Object.entries(msnEmoticons) : quickEmoticons.map(e => [e.code, { emoji: e.emoji, alt: "" }] as const);
  
  return (
    <div className={cn("bg-card border border-border rounded-lg p-2 shadow-lg", className)}>
      <div className="text-[10px] text-muted-foreground mb-2 font-bold uppercase">
        MSN Emoticons
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {emoticonsToShow.map(([code, data]) => (
          <button
            key={code}
            onClick={() => onSelect(typeof data === 'object' ? data.emoji : data)}
            title={`${code}`}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
          >
            {typeof data === 'object' ? data.emoji : data}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full text-[10px] text-primary hover:underline mt-2"
      >
        {showAll ? "Visa färre" : "Visa alla emoticons"}
      </button>
    </div>
  );
}
