import { useState, useRef, useEffect } from "react";
import { 
  Smile, Image, Gift, 
  Mic, Video, Bell, Volume2, VolumeX, X, Minimize2, Maximize2,
  Users, Gamepad2, Phone, MoreVertical
} from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useMsnSounds } from "@/hooks/useMsnSounds";
import { MsnLogin } from "./MsnLogin";
import { MsnEmoticonPicker, quickEmoticons, convertMsnEmoticons } from "./MsnEmoticons";
import { MsnContactList, type MsnContact } from "./MsnContactList";
import { MsnLogo, MsnLogoWithText } from "./MsnLogo";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  senderName: string;
}

// No demo messages - start with empty conversation
const getInitialMessages = (_friendName: string): Message[] => [];

const autoResponses = [
  "Haha, visst! :D",
  "Det var bättre förr honestly... :(",
  "OMG ja! Minns du *nudge*? (H)",
  "Nostalgitrippen är på riktigt (L)",
  "Ska vi spela något sen? :)",
  "Måste kolla, brb! (Y)",
  "Lol, klassiskt! :P",
  "Facts! De gamla messenger-tiderna :D",
  "Jag saknar wizz-funktionen ;)",
  "Ska vi lägga till fler i chatten? :O",
];

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [selectedContact, setSelectedContact] = useState<MsnContact | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactList, setShowContactList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMsnSounds();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentMessages = selectedContact 
    ? conversations[selectedContact.id] || [] 
    : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleLogin = (displayName: string, status: string) => {
    setUserDisplayName(displayName);
    setUserStatus(status as UserStatus);
    setIsLoggedIn(true);
  };

  const handleSelectContact = (contact: MsnContact) => {
    setSelectedContact(contact);
    // Initialize conversation if it doesn't exist
    if (!conversations[contact.id]) {
      setConversations(prev => ({
        ...prev,
        [contact.id]: getInitialMessages(contact.name)
      }));
    }
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
      senderName: userDisplayName || "Du",
    };
    
    setConversations(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
    }));
    setInputMessage("");
    setShowEmojis(false);
    
    if (soundEnabled) {
      playSound("send");
    }

    // Simulate typing indicator and auto-reply
    if (selectedContact.status !== "offline") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        const replyMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: randomResponse,
          timestamp: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
          isSelf: false,
          senderName: selectedContact.name,
        };
        setConversations(prev => ({
          ...prev,
          [selectedContact.id]: [...(prev[selectedContact.id] || []), replyMessage]
        }));
        
        if (soundEnabled) {
          playSound("message");
        }
      }, 1500 + Math.random() * 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const nudge = () => {
    if (soundEnabled) {
      playSound("nudge");
    }
    
    const chatWindow = document.getElementById("msn-chat-window");
    if (chatWindow) {
      chatWindow.classList.add("animate-shake");
      setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
    }
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <MsnLogin onLogin={handleLogin} />;
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full overflow-hidden", className)}>
      {/* MSN Main Window Header */}
      <div className="bg-gradient-to-r from-[#1e4c8a] via-[#2d5aa0] to-[#3d6ab8] text-white">
        <div className="flex items-center justify-between px-3 py-1.5">
          <MsnLogoWithText />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded px-2 py-1">
              <StatusIndicator status={userStatus} size="sm" />
              <span className="text-xs">{userDisplayName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Contact List */}
        {showContactList && (
          <div className="w-60 border-r border-gray-300 dark:border-gray-700 flex-shrink-0">
            <MsnContactList
              onSelectContact={handleSelectContact}
              selectedContactId={selectedContact?.id}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              {/* Chat Window Header */}
              <div 
                id="msn-chat-window"
                className="bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(200,80%,60%)] text-white"
              >
                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-b from-white/20 to-transparent">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <Avatar name={selectedContact.name} size="sm" />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusIndicator status={selectedContact.status} size="sm" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm truncate">{selectedContact.name}</h2>
                      <p className="text-[10px] text-white/80 truncate">
                        {selectedContact.statusMessage || selectedContact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10">
                      <Phone className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10">
                      <Video className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10" onClick={nudge}>
                      <Bell className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-b from-transparent to-black/10">
                  <ToolbarButton icon={<Users className="w-4 h-4" />} label="Bjud in" />
                  <ToolbarButton icon={<Mic className="w-4 h-4" />} label="Röst" />
                  <ToolbarButton icon={<Video className="w-4 h-4" />} label="Video" />
                  <ToolbarButton icon={<Gamepad2 className="w-4 h-4" />} label="Spel" />
                  <div className="h-4 w-px bg-white/30 mx-1" />
                  <ToolbarButton icon={<Bell className="w-4 h-4" />} label="Nudge" onClick={nudge} />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-3 font-mono text-sm scrollbar-nostalgic">
                {/* Conversation header */}
                <div className="text-center text-[10px] text-gray-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Du har startat en konversation med {selectedContact.name}
                </div>
                
                {currentMessages.map((message) => (
                  <div key={message.id} className="mb-2 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        "font-bold text-xs whitespace-nowrap",
                        message.isSelf ? "text-blue-600 dark:text-blue-400" : "text-[#d4388c] dark:text-pink-400"
                      )}>
                        {message.senderName} säger:
                      </span>
                      <span className="text-[10px] text-gray-500">({message.timestamp})</span>
                    </div>
                    <p className="ml-0 text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                      {convertMsnEmoticons(message.content)}
                    </p>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="mb-1 text-gray-500 italic flex items-center gap-2 text-xs">
                    <span>{selectedContact.name} skriver ett meddelande</span>
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoticon Bar */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-t border-gray-300 dark:border-gray-600 px-2 py-1.5 flex items-center gap-1">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setShowEmojis(!showEmojis)}
                  >
                    <Smile className="w-4 h-4 text-yellow-500" />
                  </Button>
                  {showEmojis && (
                    <div className="absolute bottom-full left-0 mb-1 z-50">
                      <MsnEmoticonPicker onSelect={addEmoji} />
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <Image className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <Gift className="w-4 h-4 text-gray-500" />
                </Button>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                
                {/* Quick emoticons */}
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

              {/* Input Area */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-300 dark:border-gray-600 p-2">
                <div className="flex gap-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Skriv ett meddelande..."
                    rows={2}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-sans"
                  />
                  <div className="flex flex-col gap-1">
                    <Button 
                      onClick={handleSend}
                      disabled={!inputMessage.trim()}
                      className="bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white text-xs px-4"
                    >
                      Skicka
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
              <MsnLogo size="lg" animated className="mb-4" />
              <h2 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-2">
                Välkommen till Echo Messenger!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
                Välj en kontakt från listan till vänster för att starta en konversation.
              </p>
              <div className="flex gap-2 text-xs text-gray-400">
                <span>💬 Chatta</span>
                <span>•</span>
                <span>🎮 Spela</span>
                <span>•</span>
                <span>📞 Ring</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Avatars (Desktop only) */}
        {selectedContact && (
          <div className="hidden xl:flex flex-col w-44 border-l border-gray-300 dark:border-gray-700 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <div className="flex-1 p-2 flex flex-col items-center justify-center border-b border-gray-300 dark:border-gray-600">
              <div className="relative mb-2">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-200/50 to-purple-200/50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  <Avatar name={selectedContact.name} size="xl" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <StatusIndicator status={selectedContact.status} size="md" />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full text-center font-medium">
                {selectedContact.name}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">{selectedContact.status}</p>
            </div>
            
            <div className="flex-1 p-2 flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-200/50 to-green-200/50 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  <Avatar name={userDisplayName || "Du"} size="xl" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <StatusIndicator status={userStatus} size="md" />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full text-center font-medium">
                {userDisplayName || "Du"}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">{userStatus}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#1e4c8a] to-[#2d5aa0] px-3 py-1 text-[10px] text-white/60 flex items-center justify-between">
        <span>Echo Messenger © 2025 - Nostalgi på riktigt!</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            {soundEnabled ? "Ljud på" : "Ljud av"}
          </span>
        </div>
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
