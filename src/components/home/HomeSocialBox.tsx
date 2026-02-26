import { ExternalLink } from "lucide-react";

function SocialLink({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border hover:border-primary/40">
      <ExternalLink className="w-3 h-3" />
      {label}
    </button>
  );
}

export function HomeSocialBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">🌐 Sociala Medier</h3>
      </div>
      <div className="p-3 bg-card flex flex-wrap gap-2 flex-1">
        <SocialLink label="Discord" />
        <SocialLink label="Instagram" />
        <SocialLink label="TikTok" />
      </div>
    </div>
  );
}
