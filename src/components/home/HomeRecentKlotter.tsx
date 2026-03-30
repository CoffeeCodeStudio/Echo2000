/**
 * @module HomeRecentKlotter
 * Thumbnail gallery of the latest klotter drawings — polished retro.
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
  signed_url?: string;
}

function extractStoragePath(imageUrl: string): string {
  if (!imageUrl.startsWith('http')) return imageUrl;
  const publicMatch = imageUrl.match(/\/object\/public\/klotter\/(.+)$/);
  if (publicMatch) return publicMatch[1];
  const signMatch = imageUrl.match(/\/object\/sign\/klotter\/(.+?)(\?|$)/);
  if (signMatch) return signMatch[1];
  return imageUrl;
}

export function HomeRecentKlotter() {
  const [items, setItems] = useState<KlotterItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("klotter")
        .select("id, image_url, author_name, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      if (!data || data.length === 0) return;

      const paths = data.map(d => extractStoragePath(d.image_url));
      const { data: signed } = await supabase.storage
        .from('klotter')
        .createSignedUrls(paths, 3600);

      const resolved = data.map((d, i) => ({
        ...d,
        signed_url: signed?.[i]?.signedUrl || d.image_url,
      }));
      setItems(resolved);
    };
    fetchItems();
  }, []);

  if (items.length === 0) {
    return (
      <BentoCard title="Klotterplanket" icon={<Palette className="w-4 h-4" />}>
        <div className="flex flex-col items-center justify-center text-center min-h-[60px]">
          <Palette className="w-7 h-7 text-muted-foreground/20 mb-2" />
          <p className="text-[11px] text-muted-foreground">Inga klotter ännu</p>
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
            className="relative aspect-square overflow-hidden border border-border bg-card group"
            title={k.comment ? `${k.author_name}: ${k.comment}` : k.author_name}
          >
            <img
              src={k.signed_url || k.image_url}
              alt={k.comment || "Klotter"}
              className="w-full h-full object-contain bg-white"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white truncate font-bold">{k.author_name}</p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
