import { Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  name: string;
  description: string;
  memberCount: number;
  messageCount: number;
  isActive?: boolean;
  gradient?: string;
  className?: string;
}

export function CommunityCard({
  name,
  description,
  memberCount,
  messageCount,
  isActive = false,
  className,
}: CommunityCardProps) {
  return (
    <button
      className={cn(
        "group nostalgia-card w-full p-4 text-left transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
        "hover:border-primary/30 border border-transparent",
        "active:scale-[0.98]",
        isActive && "ring-2 ring-primary/50 bg-primary/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base truncate group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 group-hover:text-foreground/70 transition-colors">{description}</p>
        </div>
        {isActive && (
          <span className="shrink-0 w-2.5 h-2.5 bg-online rounded-full glow-online animate-pulse" />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 group-hover:text-primary/80 transition-colors">
          <Users className="w-3.5 h-3.5" />
          <span>{memberCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 group-hover:text-accent/80 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{messageCount.toLocaleString()}</span>
        </div>
      </div>
    </button>
  );
}
