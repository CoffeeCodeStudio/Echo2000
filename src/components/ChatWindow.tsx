import { useState, useRef, useEffect } from "react";
import { 
  Phone, Video, MoreVertical, Smile, Image, Gift, 
  Mic, Type, Search, Bell, Volume2, VolumeX, X, Minimize2, Maximize2,
  Users, Gamepad2, Mail, Settings
} from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator } from "./StatusIndicator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useMsnSounds } from "@/hooks/useMsnSounds";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  senderName: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hej! Minns du när vi brukade chatta på MSN? 😄",
    timestamp: "14:30",
    isSelf: false,
    senderName: "Emma",
  },
  {
    id: "2",
    content: "Ja! De gamla goda tiderna med egna smileys och displaynamn 🦋",
    timestamp: "14:31",
    isSelf: true,
    senderName: "Du",
  },
  {
    id: "3",
    content: "Och de där ~*glittriga*~ namnen som alla hade lol",
    timestamp: "14:32",
    isSelf: false,
    senderName: "Emma",
  },
  {
    id: "4",
    content: "Den här appen ger mig nostalgitripp! Älskar designen ✨",
    timestamp: "14:33",
    isSelf: true,
    senderName: "Du",
  },
  {
    id: "5",
    content: "Eller hur?? Det är som en modern version av de klassiska messengerna",
    timestamp: "14:34",
    isSelf: false,
    senderName: "Emma",
  },
];

const emojis = ["😊", "😂", "😍", "🥺", "😎", "🤔", "😴", "🎉", "❤️", "👍", "✨", "🦋", "🌙", "⭐", "🔔"];

const autoResponses = [
  "Haha, visst! 😄",
  "Det var bättre förr honestly...",
  "OMG ja! Minns du *nudge*? 🔔",
  "Nostalgitrippen är på riktigt ✨",
  "Ska vi spela något sen?",
  "Måste kolla, brb! 🏃",
  "Lol, klassiskt! 😂",
  "Facts! De gamla messenger-tiderna 💯",
  "Jag saknar wizz-funktionen 😂",
  "Ska vi lägga till fler i chatten?",
];

interface ChatWindowProps {
  friendName?: string;
  friendStatus?: "online" | "away" | "busy" | "offline";
  friendStatusMessage?: string;
  friendEmail?: string;
  className?: string;
}

export function ChatWindow({ 
  friendName = "Emma", 
  friendStatus = "online",
  friendStatusMessage = "redo för helgen 🎉",
  friendEmail = "emma@echo2000.se",
  className 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMsnSounds();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
      senderName: "Du",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setShowEmojis(false);
    
    // Play send sound
    if (soundEnabled) {
      playSound("send");
    }

    // Simulate typing indicator and auto-reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        timestamp: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
        isSelf: false,
        senderName: friendName,
      };
      setMessages((prev) => [...prev, replyMessage]);
      
      // Play message received sound
      if (soundEnabled) {
        playSound("message");
      }
    }, 1500 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  const nudge = () => {
    // Play nudge sound
    if (soundEnabled) {
      playSound("nudge");
    }
    
    // Simulate nudge effect
    const chatWindow = document.getElementById("msn-chat-window");
    if (chatWindow) {
      chatWindow.classList.add("animate-shake");
      setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
    }
  };

  return (
    <div 
      id="msn-chat-window"
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden shadow-lg",
        className
      )}
    >
      {/* MSN-style Window Header */}
      <div className="bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(200,80%,60%)] text-white">
        {/* Title bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-b from-white/20 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={friendName} size="sm" status={friendStatus} />
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{friendName}</h2>
              <p className="text-[10px] text-white/80 truncate">
                {friendStatusMessage} &lt;{friendEmail}&gt;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10">
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10">
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-red-500/80">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-b from-transparent to-black/10">
          <ToolbarButton icon={<Users className="w-4 h-4" />} label="Bjud in" />
          <ToolbarButton icon={<Mic className="w-4 h-4" />} label="Röst" />
          <ToolbarButton icon={<Video className="w-4 h-4" />} label="Video" />
          <ToolbarButton icon={<Gamepad2 className="w-4 h-4" />} label="Spel" />
          <div className="h-4 w-px bg-white/30 mx-1" />
          <ToolbarButton 
            icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} 
            label={soundEnabled ? "Ljud på" : "Ljud av"} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            isActive={soundEnabled}
          />
          <ToolbarButton icon={<Bell className="w-4 h-4" />} label="Nudge" onClick={nudge} />
        </div>
      </div>

      {/* Main Chat Area - MSN Style Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-3 font-mono text-sm">
            {messages.map((message) => (
              <div key={message.id} className="mb-2">
                <span className={cn(
                  "font-bold text-sm",
                  message.isSelf ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"
                )}>
                  {message.senderName} säger:
                </span>
                <p className="ml-2 text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            ))}
            {isTyping && (
              <div className="mb-1 text-muted-foreground italic">
                {friendName} skriver...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Toolbar */}
          <div className="bg-muted/50 border-t border-border px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setShowEmojis(!showEmojis)}
            >
              <Smile className="w-4 h-4 text-yellow-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Image className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Gift className="w-4 h-4 text-muted-foreground" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Type className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            {/* Quick emojis */}
            <div className="flex gap-0.5 ml-2">
              {["😊", "😂", "😍", "😎", "🤔"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-lg hover:scale-125 transition-transform px-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Picker */}
          {showEmojis && (
            <div className="bg-card border-t border-border p-2 grid grid-cols-8 gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:bg-muted rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="bg-card border-t border-border p-2">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Skriv ett meddelande..."
                rows={2}
                className="flex-1 bg-white dark:bg-muted border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  onClick={handleSend}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white text-xs px-4"
                >
                  Skicka
                </Button>
                <Button 
                  variant="outline"
                  className="text-xs px-4"
                >
                  Sök
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Webcam/Avatar Panel - Desktop only */}
        <div className="hidden lg:flex flex-col w-48 border-l border-border bg-muted/30">
          {/* Friend's "webcam" area */}
          <div className="flex-1 p-2 flex flex-col items-center justify-center border-b border-border">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <Avatar name={friendName} size="xl" status={friendStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{friendName}</p>
          </div>
          
          {/* Your "webcam" area */}
          <div className="flex-1 p-2 flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg flex items-center justify-center">
              <Avatar name="Du" size="xl" status="online" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Du</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/50 border-t border-border px-2 py-1 text-[10px] text-muted-foreground text-center">
        💬 Chatta med dina vänner - precis som förr i tiden!
      </div>
    </div>
  );
}

function ToolbarButton({ 
  icon, 
  label,
  onClick,
  isActive = false
}: { 
  icon: React.ReactNode; 
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-white/10 transition-colors",
        isActive && "bg-white/20"
      )}
    >
      {icon}
      <span className="text-[9px] text-white/80">{label}</span>
    </button>
  );
}
