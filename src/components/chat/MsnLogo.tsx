import { cn } from "@/lib/utils";
import echoButterfly from "@/assets/echo-butterfly.png";

interface MsnLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

export function MsnLogo({ size = "md", className, animated = false }: MsnLogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <img
        src={echoButterfly}
        alt="Echo Messenger"
        className={cn("w-full h-full object-contain", animated && "animate-pulse-soft")}
      />
    </div>
  );
}

export function MsnLogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MsnLogo size="md" animated />
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-tight text-white">
          Echo<span className="text-green-400">Messenger</span>
        </span>
        <span className="text-[9px] text-white/60 leading-tight">
          .NET Messenger Service
        </span>
      </div>
    </div>
  );
}
