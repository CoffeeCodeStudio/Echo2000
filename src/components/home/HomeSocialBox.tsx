import { ExternalLink, Globe } from "lucide-react";
import { BentoCard } from "./BentoCard";

function SocialLink({ label, href }: { label: string; href?: string }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="pressable flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-[hsl(var(--glass-border))] hover:border-primary/40 bg-muted/20"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </Tag>
  );
}

export function HomeSocialBox() {
  return (
    <BentoCard title="Sociala Medier" icon={<Globe className="w-4 h-4" />}>
      <div className="flex flex-wrap gap-2">
        <SocialLink label="Discord" href="https://discord.gg/Wp2uF3vF" />
        <SocialLink label="Instagram" />
        <SocialLink label="TikTok" />
      </div>
    </BentoCard>
  );
}
