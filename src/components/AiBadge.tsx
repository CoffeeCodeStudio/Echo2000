import { cn } from "@/lib/utils";

interface AiBadgeProps {
  className?: string;
}

export function AiBadge({ className }: AiBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none select-none shrink-0",
        className
      )}
      style={{ backgroundColor: "#00BFDF", color: "#fff" }}
      title="AI-bot"
    >
      AI
    </span>
  );
}
