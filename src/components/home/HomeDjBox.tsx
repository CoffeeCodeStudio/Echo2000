import { Music } from "lucide-react";

export function HomeDjBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1">
          <Music className="w-4 h-4" /> Dagens DJ
        </h3>
      </div>
      <div className="p-4 bg-card flex flex-col items-center justify-center text-center min-h-[80px] flex-1">
        <Music className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </div>
  );
}
