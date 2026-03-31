import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import type { UserStatus } from "../StatusIndicator";
import { useNavigate } from "react-router-dom";
import { AiBadge } from "../AiBadge";

interface FriendItemProps {
  name: string;
  username?: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  isActive?: boolean;
  isBot?: boolean;
  onClick?: () => void;
}

export function FriendItem({
  name,
  username,
  avatar,
  status,
  statusMessage,
  isActive = false,
  isBot = false,
  onClick,
}: FriendItemProps) {
  const navigate = useNavigate();

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${encodeURIComponent(username)}`);
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 transition-all duration-200 border-b border-border/30",
        "hover:bg-[#fff3e6] active:scale-[0.98]",
        isActive && "bg-[#fff3e6] border-l-2 border-l-[#ff6600]"
      )}
    >
      <div onClick={handleProfileClick} className="cursor-pointer">
        <Avatar src={avatar} name={name} status={status} size="md" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <p 
            className="font-bold text-[11px] truncate hover:text-[#ff6600] transition-colors cursor-pointer"
            onClick={handleProfileClick}
          >
            {name}
          </p>
          {isBot && <AiBadge />}
        </div>
        {statusMessage && (
          <p className="text-xs text-muted-foreground truncate italic">
            {statusMessage}
          </p>
        )}
      </div>
    </button>
  );
}
