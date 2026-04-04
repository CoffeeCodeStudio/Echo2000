/** Desktop toolbar with call/invite/game/nudge actions — retro style */
import { Users, Mic, Video, Gamepad2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoCallMenu } from "../calls/VideoCallMenu";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function ToolbarButton({ icon, label, onClick, isActive = false }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors text-muted-foreground hover:text-[#ff6600] hover:bg-[#fff3e6]",
        isActive && "text-[#ff6600] bg-[#fff3e6]"
      )}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

interface ChatToolbarProps {
  onInvite: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onScreenShare: () => void;
  onNudge: () => void;
  onGames?: () => void;
  showInviteDialog: boolean;
  callActive: boolean;
  callType: string;
}

export function ChatToolbar({
  onInvite, onVoiceCall, onVideoCall, onScreenShare, onNudge, onGames,
  showInviteDialog, callActive, callType,
}: ChatToolbarProps) {
  return (
    <div className="hidden md:flex items-center gap-0.5 px-2 py-0.5 bg-muted/50 border-b border-border">
      <ToolbarButton
        icon={<Users className="w-3.5 h-3.5" />}
        label="Bjud in"
        onClick={onInvite}
        isActive={showInviteDialog}
      />
      <ToolbarButton
        icon={<Mic className="w-3.5 h-3.5" />}
        label="Röst"
        onClick={onVoiceCall}
        isActive={callActive && callType === "voice"}
      />
      <VideoCallMenu onSelectCamera={onVideoCall} onSelectScreen={onScreenShare}>
        <div>
          <ToolbarButton
            icon={<Video className="w-3.5 h-3.5" />}
            label="Video"
            isActive={callActive && (callType === "video" || callType === "screenshare")}
          />
        </div>
      </VideoCallMenu>
      <ToolbarButton icon={<Gamepad2 className="w-3.5 h-3.5" />} label="Spel" onClick={onGames} />
      <div className="h-3 w-px bg-border mx-1" />
      <ToolbarButton icon={<Bell className="w-3.5 h-3.5" />} label="Nudge" onClick={onNudge} />
    </div>
  );
}
