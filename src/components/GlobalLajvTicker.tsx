import { useState, useEffect } from 'react';
import { useLajv } from '@/contexts/LajvContext';
import { Avatar } from './Avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Radio, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { replaceEmoteCodes, EmotePicker } from './PixelEmotes';

export function GlobalLajvTicker() {
  const { messages, sendMessage, sending } = useLajv();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [showInput, setShowInput] = useState(false);

  // Rotate through messages every 5 seconds
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentDisplayIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentDisplayIndex >= messages.length && messages.length > 0) {
      setCurrentDisplayIndex(0);
    }
  }, [messages.length, currentDisplayIndex]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      setShowInput(false);
      toast.success('Meddelande skickat!');
    } else {
      toast.error('Kunde inte skicka meddelandet');
    }
  };

  const currentMessage = messages[currentDisplayIndex];

  return (
    <div className="lajv-ticker-row">
      {/* Radio icon */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <Radio className="w-4 h-4 text-primary" />
          {messages.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="font-bold text-xs text-primary uppercase tracking-wide">LAJV</span>
      </div>

      {/* Message display area */}
      <div className="flex-1 min-w-0 mx-3">
        {messages.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">
            Just nu finns inga aktiva lajvsändningar
          </span>
        ) : currentMessage ? (
          <div className="flex items-center gap-2 text-sm animate-fade-in">
            <Avatar
              name={currentMessage.username}
              src={currentMessage.avatar_url || undefined}
              size="sm"
              className="w-5 h-5"
            />
            <span className="font-semibold text-foreground truncate max-w-[100px]">
              {currentMessage.username}:
            </span>
            <span className="text-foreground/90 truncate flex-1">
              {replaceEmoteCodes(currentMessage.message)}
            </span>
            {messages.length > 1 && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({currentDisplayIndex + 1}/{messages.length})
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Input area - inline */}
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          {showInput ? (
            <div className="flex items-center gap-1">
              <EmotePicker 
                onSelect={(code) => setNewMessage(prev => prev + " " + code + " ")} 
                className="scale-75"
              />
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Skriv något..."
                className="h-7 w-32 text-sm bg-background/50"
                maxLength={280}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                  if (e.key === 'Escape') {
                    setShowInput(false);
                    setNewMessage('');
                  }
                }}
                autoFocus
              />
              <Button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                size="sm"
                className="h-7 px-2"
              >
                {sending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setShowInput(false);
                  setNewMessage('');
                }}
              >
                ✕
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => setShowInput(true)}
            >
              Skriv
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
