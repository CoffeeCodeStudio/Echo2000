import { Music } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { PixelDj } from "@/components/dj/PixelDj";

export function HomeDjBox() {
  return (
    <BentoCard title="DJ Echo" icon={<Music className="w-4 h-4" />}>
      <PixelDj compact />
    </BentoCard>
  );
}
