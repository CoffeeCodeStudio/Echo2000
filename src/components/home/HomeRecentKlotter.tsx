/**
 * @module HomeRecentKlotter
 * Thumbnail gallery of the latest klotter drawings.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Palette } from "lucide-react";
import { BentoCard } from "./BentoCard";

interface KlotterItem {
  id: string;
  image_url: string;
  author_name: string;
  comment: string | null;
  created_at: string;
}

export function HomeRecentKlotter() {
  const [items, setItems] = useState<KlotterItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("klotter")
        .select("id, image_url, author_name, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setItems(data);
    };
    fetch();
  }, []);

  if (items.length === 0) {
    return (
      <BentoCard title="Klotterplanket" icon={<Palette className="w-4 h-4" />}>
        <div className="flex flex-col items-center justify-center text-center min-h-[60px]">
          <Palette className="w-7 h-7 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">Inga klotter ännu</p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard title="Klotterplanket" icon={<Palette className="w-4 h-4" />}>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((k) => (
          <div
            key={k.id}
            className="relative aspect-square rounded overflow-hidden border border-border/30 bg-muted/20 group"
            title={k.comment ? `${k.author_name}: ${k.comment}` : k.author_name}
          >
            <img
              src={k.image_url}
              alt={k.comment || "Klotter"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white truncate">{k.author_name}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
