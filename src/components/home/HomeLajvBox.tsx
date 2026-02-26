import { Radio } from "lucide-react";

export function HomeLajvBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1">
          <Radio className="w-4 h-4 animate-pulse" /> Lajv Just Nu!
        </h3>
      </div>
      <div className="p-4 bg-card flex flex-col items-center justify-center text-center min-h-[80px] flex-1">
        <Radio className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </div>
  );
}
