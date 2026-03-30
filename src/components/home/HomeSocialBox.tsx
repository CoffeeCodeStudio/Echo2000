import { ExternalLink, Globe } from "lucide-react";
import { BentoCard } from "./BentoCard";

function SocialLink({ label, href }: { label: string; href?: string }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded border border-[hsl(var(--lunar-box-border))] hover:border-primary/40 bg-white/5 cursor-pointer"
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
        <SocialLink label="Discord" href="https://discord.gg/UTfa8EXa6D" />
        <SocialLink label="Instagram" />
        <SocialLink label="TikTok" />
      </div>
    </BentoCard>
  );
}
