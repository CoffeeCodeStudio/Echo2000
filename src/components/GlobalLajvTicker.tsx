import { useState, useEffect } from 'react';
import { useLajv, LajvMessage } from '@/contexts/LajvContext';
import { Avatar } from './Avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Radio, Send, X, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function GlobalLajvTicker() {
  const { messages, sendMessage, sending } = useLajv();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);

  // Rotate through messages every 5 seconds when collapsed
  useEffect(() => {
    if (messages.length <= 1 || isExpanded) return;

    const interval = setInterval(() => {
      setCurrentDisplayIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length, isExpanded]);

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
      toast.success('Meddelande skickat!');
    } else {
      toast.error('Kunde inte skicka meddelandet');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    return diffMins;
  };

  const currentMessage = messages[currentDisplayIndex];

  return (
    <div 
      className={cn(
        "fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40",
        "bg-card/95 backdrop-blur-md border border-primary/30 rounded-xl shadow-2xl",
        "transition-all duration-300 ease-out",
        isExpanded ? "max-h-[70vh]" : "max-h-20"
      )}
    >
      {/* Header - Always visible, clickable to expand */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-primary" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="font-display font-bold text-sm">LAJV</span>
          <span className="text-xs text-muted-foreground">
            {messages.length} {messages.length === 1 ? 'meddelande' : 'meddelanden'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Collapsed view - show rotating message */}
      {!isExpanded && messages.length > 0 && currentMessage && (
        <div className="px-3 pb-3 -mt-1">
          <div className="flex items-center gap-2 text-sm">
            <Avatar
              name={currentMessage.username}
              src={currentMessage.avatar_url || undefined}
            size="sm"
            />
            <span className="font-semibold text-xs truncate max-w-[80px]">
              {currentMessage.username}:
            </span>
            <span className="text-muted-foreground truncate flex-1">
              {currentMessage.message}
            </span>
          </div>
        </div>
      )}

      {/* Collapsed view - no messages */}
      {!isExpanded && messages.length === 0 && (
        <div className="px-3 pb-3 -mt-1">
          <span className="text-xs text-muted-foreground">Klicka för att skriva ett lajv-meddelande</span>
        </div>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="flex flex-col max-h-[calc(70vh-60px)]">
          {/* Message input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Avatar
                name={user?.email?.split('@')[0] || 'Gäst'}
                size="sm"
              />
              <div className="flex-1 flex flex-col gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Dela något med alla just nu..."
                  className="min-h-[50px] max-h-[80px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {newMessage.length}/280
                  </span>
                  <Button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim() || newMessage.length > 280}
                    size="sm"
                    className="gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Skicka
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto max-h-[300px] p-3 space-y-2 border-t border-border">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Inga lajv-meddelanden just nu.</p>
                <p className="text-xs mt-1">Var först med att dela något!</p>
              </div>
            ) : (
              [...messages].reverse().map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 p-2 rounded-lg bg-muted/50",
                    msg.user_id === user?.id && "bg-primary/10"
                  )}
                >
                  <Avatar
                    name={msg.username}
                    src={msg.avatar_url || undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs truncate">{msg.username}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-xs break-words mt-0.5">{msg.message}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{getTimeRemaining(msg.expires_at)} min kvar</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
