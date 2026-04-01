/** Main retro-style header bar showing user status, sound toggle, and settings */
import { useState } from "react";
import { Volume2, VolumeX, Settings, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { MsnLogoWithText } from "./MsnLogo";
import { MsnSettingsPanel } from "../settings/MsnSettingsPanel";

interface ChatHeaderProps {
  userDisplayName: string;
  userStatus: UserStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout?: () => void;
}

export function ChatHeader({ userDisplayName, userStatus, soundEnabled, onToggleSound, onLogout }: ChatHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="lunar-box-header">
        <div className="flex items-center justify-between px-3 py-1.5">
          <MsnLogoWithText />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1">
              <StatusIndicator status={userStatus} size="sm" />
              <span className="text-[11px] text-white font-bold">{userDisplayName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={() => setShowSettings(true)}
              title="Alternativ"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={onToggleSound}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {onLogout && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-red-500/30"
                onClick={onLogout}
                title="Logga ut"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <MsnSettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
