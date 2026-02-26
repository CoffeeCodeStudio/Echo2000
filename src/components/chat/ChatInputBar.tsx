/** Emoticon bar + text input + send button */
import { useState } from "react";
import { Smile, Image, Gift } from "lucide-react";
import { Button } from "../ui/button";
import { MsnEmoticonPicker, quickEmoticons } from "./MsnEmoticons";

interface ChatInputBarProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function ChatInputBar({ inputMessage, onInputChange, onSend, onFocus, onBlur }: ChatInputBarProps) {
  const [showEmojis, setShowEmojis] = useState(false);

  const addEmoji = (emoji: string) => {
    onInputChange(inputMessage + emoji);
    setShowEmojis(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      {/* Emoticon Bar */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-t border-gray-300 dark:border-gray-600 px-2 py-1.5 flex items-center gap-1">
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowEmojis(!showEmojis)}>
            <Smile className="w-4 h-4 text-yellow-500" />
          </Button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-1 z-50">
              <MsnEmoticonPicker onSelect={addEmoji} />
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><Image className="w-4 h-4 text-gray-500" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><Gift className="w-4 h-4 text-gray-500" /></Button>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        <div className="flex gap-0.5 overflow-x-auto">
          {quickEmoticons.slice(0, 10).map((item) => (
            <button
              key={item.code}
              onClick={() => addEmoji(item.emoji)}
              title={item.code}
              className="text-base hover:scale-125 transition-transform px-0.5 hover:bg-white/50 rounded flex-shrink-0"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-300 dark:border-gray-600 p-2">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Skriv ett meddelande..."
            rows={2}
            className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-sans"
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={onSend}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white text-xs px-4"
            >
              Skicka
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
