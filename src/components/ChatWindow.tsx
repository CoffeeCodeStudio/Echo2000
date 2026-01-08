import { useState } from "react";
import { Phone, Video, MoreVertical, Sparkles } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { Avatar } from "./Avatar";
import { StatusIndicator } from "./StatusIndicator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  senderName?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hey! Remember when we used to chat on MSN Messenger? 😄",
    timestamp: "2:30 PM",
    isSelf: false,
    senderName: "Sarah Chen",
  },
  {
    id: "2",
    content: "Omg yes! The good old days with custom emoticons and display names 🦋",
    timestamp: "2:31 PM",
    isSelf: true,
  },
  {
    id: "3",
    content: "And those ~*sparkly*~ nicknames everyone had lol",
    timestamp: "2:32 PM",
    isSelf: false,
    senderName: "Sarah Chen",
  },
  {
    id: "4",
    content: "This app is bringing back all the nostalgia! Love the design ✨",
    timestamp: "2:33 PM",
    isSelf: true,
  },
  {
    id: "5",
    content: "Right?? It's like a modern version of those classic messengers",
    timestamp: "2:34 PM",
    isSelf: false,
    senderName: "Sarah Chen",
  },
];

interface ChatWindowProps {
  friendName?: string;
  friendStatus?: "online" | "away" | "busy" | "offline";
  className?: string;
}

export function ChatWindow({ 
  friendName = "Sarah Chen", 
  friendStatus = "online",
  className 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Chat Header */}
      <div className="msn-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={friendName} status={friendStatus} size="md" />
          <div>
            <h2 className="font-semibold text-sm">{friendName}</h2>
            <div className="flex items-center gap-1.5">
              <StatusIndicator status={friendStatus} size="sm" />
              <span className="text-xs text-muted-foreground capitalize">
                {friendStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-4 space-y-4">
        {/* Welcome banner */}
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Chat started with {friendName}</span>
          <Sparkles className="w-3 h-3 text-primary" />
        </div>

        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.content}
            timestamp={message.timestamp}
            isSelf={message.isSelf}
            senderName={message.senderName}
            showAvatar={!message.isSelf}
          />
        ))}
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
