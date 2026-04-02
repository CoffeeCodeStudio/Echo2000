/**
 * @module BotCallWindow
 * Simulated call window for bot contacts.
 * Shows a call UI with the bot's avatar, call duration, and speaking indicator.
 */
import { PhoneOff, Volume2 } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";

interface BotCallWindowProps {
  botName: string;
  botAvatar?: string;
  duration: number;
  isSpeaking: boolean;
  onEndCall: () => void;
}

export function BotCallWindow({ botName, botAvatar, duration, isSpeaking, onEndCall }: BotCallWindowProps) {
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center gap-6">
      {/* Bot avatar with speaking ring */}
      <div className={`relative ${isSpeaking ? "animate-pulse" : ""}`}>
        <div className={`rounded-full p-1 ${isSpeaking ? "ring-4 ring-green-400/60" : "ring-2 ring-white/20"} transition-all duration-300`}>
          <Avatar
            src={botAvatar}
            name={botName}
            size="xl"
          />
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-green-400 rounded-full animate-bounce"
                style={{
                  height: `${8 + Math.random() * 12}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.4 + Math.random() * 0.3}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Name and status */}
      <div className="text-center">
        <h3 className="text-white font-bold text-lg">{botName}</h3>
        <p className="text-green-400 text-sm flex items-center gap-1 justify-center">
          <Volume2 className="w-3 h-3" />
          {isSpeaking ? "Pratar..." : "I samtal"}
        </p>
        <p className="text-white/60 text-xs mt-1 font-mono">{formatDuration(duration)}</p>
      </div>

      {/* End call button */}
      <Button
        onClick={onEndCall}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>

      <p className="text-white/30 text-[10px] mt-4">
        🤖 Bot-samtal — rösten genereras via din webbläsare
      </p>
    </div>
  );
}
