/**
 * @module BackgroundPicker
 * Modal for selecting a presentation background image from curated picks or Unsplash search.
 */
import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CURATED_BACKGROUNDS,
  SEARCH_CATEGORIES,
  searchUnsplash,
  isSearchAvailable,
  type UnsplashPhoto,
} from "@/lib/unsplash";

interface BackgroundPickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"favorites" | "search">("favorites");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSelect = useCallback((url: string) => {
    onChange(url);
    setOpen(false);
  }, [onChange]);

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setSearching(true);
    const photos = await searchUnsplash(searchQuery);
    setResults(photos);
    setSearching(false);
  }, [query]);

  const handleCategoryClick = useCallback((category: string) => {
    setQuery(category);
    handleSearch(category);
  }, [handleSearch]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Välj bakgrund 🖼️
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Välj bakgrundsbild</DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setTab("favorites")}
                className={cn(
                  "px-3 py-1 text-xs rounded-t transition-colors",
                  tab === "favorites"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                ⭐ Favoriter
              </button>
              <button
                type="button"
                onClick={() => setTab("search")}
                className={cn(
                  "px-3 py-1 text-xs rounded-t transition-colors",
                  tab === "search"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                🔍 Sök
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {tab === "favorites" ? (
                <div className="grid grid-cols-3 gap-2 p-1">
                  {CURATED_BACKGROUNDS.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handleSelect(photo.url)}
                      className={cn(
                        "relative aspect-video rounded overflow-hidden border-2 transition-all hover:scale-105",
                        value === photo.url ? "border-primary ring-2 ring-primary/30" : "border-border"
                      )}
                    >
                      <img
                        src={photo.thumb}
                        alt={photo.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                        {photo.alt}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {!isSearchAvailable ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      <p className="mb-1">Sök kräver en Unsplash API-nyckel.</p>
                      <p>Använd favoriterna istället eller lägg till VITE_UNSPLASH_ACCESS_KEY.</p>
                    </div>
                  ) : (
                    <>
                      {/* Search input */}
                      <div className="flex gap-1.5">
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          placeholder="Sök bilder..."
                          className="text-xs h-8"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSearch()}
                          disabled={searching}
                          className="h-8 px-3"
                        >
                          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        </Button>
                      </div>

                      {/* Quick categories */}
                      <div className="flex flex-wrap gap-1">
                        {SEARCH_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryClick(cat)}
                            className="px-2 py-0.5 text-[10px] rounded-full bg-muted hover:bg-accent transition-colors"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Results grid */}
                      {searching ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : results.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {results.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => handleSelect(photo.url)}
                              className="relative aspect-video rounded overflow-hidden border-2 border-border hover:border-primary transition-all hover:scale-105"
                            >
                              <img
                                src={photo.thumb}
                                alt={photo.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground py-4">
                          Klicka på en kategori eller sök för att hitta bilder.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-xs gap-1 text-destructive hover:text-destructive"
          >
            <X className="w-3 h-3" />
            Ta bort
          </Button>
        )}
      </div>

      {/* Preview */}
      {value && (
        <div className="relative w-full h-16 rounded overflow-hidden border border-border">
          <img src={value} alt="Vald bakgrund" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-[10px] font-mono">Bakgrundsförhandsvisning</span>
          </div>
        </div>
      )}
    </div>
  );
}
