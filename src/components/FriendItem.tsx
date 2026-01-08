import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import type { UserStatus } from "./StatusIndicator";

interface FriendItemProps {
  name: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function FriendItem({
  name,
  avatar,
  status,
  statusMessage,
  isActive = false,
  onClick,
}: FriendItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "hover:bg-muted/50 active:scale-[0.98]",
        isActive && "bg-muted/70 glow-primary"
      )}
    >
      <Avatar src={avatar} name={name} status={status} size="md" />
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium text-sm truncate">{name}</p>
        {statusMessage && (
          <p className="text-xs text-muted-foreground truncate italic">
            {statusMessage}
          </p>
        )}
      </div>
    </button>
  );
}
