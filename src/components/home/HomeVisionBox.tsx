import { Gamepad2, Palette, Heart, Bot } from "lucide-react";

function VisionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function HomeVisionBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">💡 Vår Vision</h3>
      </div>
      <div className="p-3 bg-card space-y-2">
        <VisionItem icon={<Gamepad2 className="w-4 h-4 text-primary" />} text="Spel & Tävlingar" />
        <VisionItem icon={<Palette className="w-4 h-4 text-accent" />} text="Konst & Kreativitet" />
        <VisionItem icon={<Heart className="w-4 h-4 text-destructive" />} text="Gemenskap & Vänskap" />
        <div className="flex items-start gap-2 pt-2 mt-2 border-t border-border">
          <div className="flex-shrink-0">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="relative bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
            <div className="absolute -left-1.5 top-2 w-0 h-0 border-t-[5px] border-t-transparent border-r-[6px] border-r-border border-b-[5px] border-b-transparent" />
            Vad väntar du på? Inget MSN-virus här inte!
          </div>
        </div>
      </div>
    </div>
  );
}
