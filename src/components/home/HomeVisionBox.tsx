import { Gamepad2, Palette, Heart, Bot, Lightbulb } from "lucide-react";
import { BentoCard } from "./BentoCard";

function VisionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {icon}
      <span className="text-[11px] text-muted-foreground">{text}</span>
    </div>
  );
}

export function HomeVisionBox() {
  return (
    <BentoCard title="Vår Vision" icon={<Lightbulb className="w-4 h-4" />}>
      <div>
        <VisionItem icon={<Gamepad2 className="w-3.5 h-3.5 text-primary" />} text="Spel & Tävlingar" />
        <VisionItem icon={<Palette className="w-3.5 h-3.5 text-primary" />} text="Konst & Kreativitet" />
        <VisionItem icon={<Heart className="w-3.5 h-3.5 text-destructive" />} text="Gemenskap & Vänskap" />
        <div className="flex items-start gap-2 pt-2 mt-1">
          <Bot className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="relative bg-muted border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <div className="absolute -left-1 top-2 w-0 h-0 border-t-4 border-t-transparent border-r-[5px] border-r-border border-b-4 border-b-transparent" />
            Vad väntar du på? Inget MSN-virus här inte!
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
