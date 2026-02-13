import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  Smile, Image, Gift, 
  Mic, Video, Bell, Volume2, VolumeX, X, Minimize2, Maximize2,
  Users, Gamepad2, Phone, MoreVertical, ArrowLeft, Loader2
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useChatMessages } from "@/hooks/useChatMessages";
import type { LayoutContext } from "./SharedLayout";

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [selectedContact, setSelectedContact] = useState<MsnContact | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactList, setShowContactList] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMsnSounds();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Persistent chat messages from database
  const { messages: dbMessages, loading: messagesLoading, sendMessage: sendDbMessage } = useChatMessages(selectedContact?.id || null);
  
  // Get layout context for hiding navbar
  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;
  
  // Hide navbar when input is focused on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar) {
      setHideNavbar(inputFocused);
    }
    return () => {
      if (setHideNavbar) setHideNavbar(false);
    };
  }, [inputFocused, isMobile, setHideNavbar]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Map DB messages to display format with date info
  const currentMessages = dbMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
    isSelf: msg.sender_id === user?.id,
    senderName: msg.sender_id === user?.id ? (userDisplayName || "Du") : (selectedContact?.name || ""),
    date: new Date(msg.created_at),
  }));

  // Helper to format date separator labels
  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Idag";
    if (isSameDay(date, yesterday)) return "Igår";
    return date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length]);

  const handleLogin = (displayName: string, status: string) => {
    setUserDisplayName(displayName);
    setUserStatus(status as UserStatus);
    setIsLoggedIn(true);
  };

  const handleSelectContact = (contact: MsnContact) => {
    setSelectedContact(contact);
    // On mobile, switch to chat view
    if (isMobile) {
      setMobileShowChat(true);
    }
  };

  const handleBackToContacts = () => {
    setMobileShowChat(false);
  };
  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedContact) return;

    const msg = inputMessage;
    setInputMessage("");
    setShowEmojis(false);
    
    if (soundEnabled) {
      playSound("send");
    }

    await sendDbMessage(msg);
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
        {/* Contact List - Hidden on mobile when chat is open */}
        {showContactList && (!isMobile || !mobileShowChat) && (
          <div className={cn(
            "border-r border-gray-300 dark:border-gray-700 flex-shrink-0",
            isMobile ? "w-full" : "w-60"
          )}>
            <MsnContactList
              onSelectContact={handleSelectContact}
              selectedContactId={selectedContact?.id}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* Chat Area - Full width on mobile when visible */}
        {(!isMobile || mobileShowChat) && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedContact ? (
              <>
                {/* Chat Window Header - Cleaner layout */}
                <div 
                  id="msn-chat-window"
                  className="bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(200,80%,60%)] text-white"
                >
                  <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-b from-white/20 to-transparent gap-2">
                    {/* Back button on mobile */}
                    {isMobile && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white hover:bg-white/20 flex-shrink-0"
                        onClick={handleBackToContacts}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}
                    
                    {/* Contact info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar name={selectedContact.name} size="sm" />
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <StatusIndicator status={selectedContact.status} size="sm" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-sm truncate">{selectedContact.name}</h2>
                        <p className="text-[11px] text-white/80 truncate">
                          {selectedContact.statusMessage || selectedContact.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons - hidden on very small screens */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 hidden sm:flex">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 hidden sm:flex">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={nudge}>
                        <Bell className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Toolbar - Hidden on mobile */}
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-gradient-to-b from-transparent to-black/10">
                    <ToolbarButton icon={<Users className="w-4 h-4" />} label="Bjud in" />
                    <ToolbarButton icon={<Mic className="w-4 h-4" />} label="Röst" />
                    <ToolbarButton icon={<Video className="w-4 h-4" />} label="Video" />
                    <ToolbarButton icon={<Gamepad2 className="w-4 h-4" />} label="Spel" />
                    <div className="h-4 w-px bg-white/30 mx-1" />
                    <ToolbarButton icon={<Bell className="w-4 h-4" />} label="Nudge" onClick={nudge} />
                  </div>
                </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-3 font-mono text-sm scrollbar-nostalgic">
                {/* Conversation header */}
                <div className="text-center text-[11px] text-gray-600 dark:text-gray-400 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
                  Du har startat en konversation med {selectedContact.name}
                </div>
                
                {messagesLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {currentMessages.map((message, index) => {
                  const prevMessage = currentMessages[index - 1];
                  const showDateSeparator = !prevMessage || 
                    formatDateLabel(message.date) !== formatDateLabel(prevMessage.date);

                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-900 px-2">
                            {formatDateLabel(message.date)}
                          </span>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                      )}
                      <div className="mb-2 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "font-bold text-xs whitespace-nowrap",
                            message.isSelf ? "text-blue-600 dark:text-blue-400" : "text-[#d4388c] dark:text-pink-400"
                          )}>
                            {message.senderName} säger:
                          </span>
                          <span className="text-[10px] text-gray-500">({message.timestamp})</span>
                        </div>
                        <p className="ml-0 text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                          {convertMsnEmoticons(message.content)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
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
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Skriv ett meddelande..."
                    rows={2}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-sans"
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
        )}

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
