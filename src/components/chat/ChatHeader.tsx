/** Main MSN-style header bar showing user status and sound toggle */
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { MsnLogoWithText } from "./MsnLogo";

interface ChatHeaderProps {
  userDisplayName: string;
  userStatus: UserStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function ChatHeader({ userDisplayName, userStatus, soundEnabled, onToggleSound }: ChatHeaderProps) {
  return (
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
            onClick={onToggleSound}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
