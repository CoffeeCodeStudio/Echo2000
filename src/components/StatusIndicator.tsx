import { cn } from "@/lib/utils";

export type UserStatus = "online" | "away" | "busy" | "offline";

interface StatusIndicatorProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

const statusClasses: Record<UserStatus, string> = {
  online: "status-online",
  away: "status-away",
  busy: "status-busy",
  offline: "status-offline",
};

export function StatusIndicator({ status, size = "md", className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        "status-indicator",
        sizeClasses[size],
        statusClasses[status],
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
