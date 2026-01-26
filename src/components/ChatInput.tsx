import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { EmotePicker } from "./PixelEmotes";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ onSend, placeholder = "Type a message...", className }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleEmoteSelect = (code: string) => {
    setMessage((prev) => prev + " " + code + " ");
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 p-3 bg-card/80 backdrop-blur-sm border-t border-border",
        className
      )}
    >
      <EmotePicker onSelect={handleEmoteSelect} />
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 input-glow transition-all"
      />
      <Button
        type="submit"
        variant="msn"
        size="icon"
        disabled={!message.trim()}
        className="shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
