/** Per-conversation header showing contact info + action buttons */
import { ArrowLeft, Phone, Video, Bell, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";
import { StatusIndicator } from "../StatusIndicator";
import { VideoCallMenu } from "../calls/VideoCallMenu";
import type { MsnContact } from "./MsnContactList";

interface ChatContactHeaderProps {
  contact: MsnContact;
  isMobile: boolean;
  onBack: () => void;
  onNudge: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onScreenShare: () => void;
}

export function ChatContactHeader({
  contact, isMobile, onBack, onNudge, onVoiceCall, onVideoCall, onScreenShare,
}: ChatContactHeaderProps) {
  return (
    <div id="msn-chat-window" className="bg-card border-b-2 border-[#ff6600]">
      <div className="flex items-center justify-between px-2 py-2 gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar name={contact.name} size="sm" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusIndicator status={contact.status} size="sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-[12px] text-foreground truncate">{contact.name}</h2>
            <p className="text-[10px] text-muted-foreground truncate italic">{contact.statusMessage || contact.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <VideoCallMenu onSelectCamera={onVideoCall} onSelectScreen={onScreenShare}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#ff6600] hover:bg-[#fff3e6] hidden sm:flex">
              <Video className="w-3.5 h-3.5" />
            </Button>
          </VideoCallMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#ff6600] hover:bg-[#fff3e6]" onClick={onNudge}>
            <Bell className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted">
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
