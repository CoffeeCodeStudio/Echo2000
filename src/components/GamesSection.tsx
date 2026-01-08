import { useState } from "react";
import { Gamepad2, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Game {
  id: string;
  name: string;
  thumbnail: string;
  embedUrl: string;
  category: string;
}

const games: Game[] = [
  {
    id: "1",
    name: "Tetris Classic",
    thumbnail: "https://images.unsplash.com/photo-1640955014216-75201056c829?w=300&h=200&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/tetris",
    category: "Pussel",
  },
  {
    id: "2",
    name: "2048",
    thumbnail: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=300&h=200&fit=crop",
    embedUrl: "https://play2048.co/",
    category: "Pussel",
  },
  {
    id: "3",
    name: "Pac-Man",
    thumbnail: "https://images.unsplash.com/photo-1579309401389-a2476dddf3d4?w=300&h=200&fit=crop",
    embedUrl: "https://www.google.com/logos/2010/pacman10-i.html",
    category: "Arkad",
  },
  {
    id: "4",
    name: "Snake",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=300&h=200&fit=crop",
    embedUrl: "https://www.google.com/fbx?fbx=snake_arcade",
    category: "Arkad",
  },
];

const categories = ["Alla", "Arkad", "Pussel"];

export function GamesSection() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alla");

  const filteredGames = activeCategory === "Alla" 
    ? games 
    : games.filter(g => g.category === activeCategory);

  const handleFullscreen = () => {
    const iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
    if (iframe) {
      if (!document.fullscreenElement) {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Spelzonen</h1>
            <p className="text-sm text-muted-foreground">Klassiska spel direkt i webbläsaren!</p>
          </div>
        </div>

        {/* Game Player Modal */}
        {selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
            <div className={cn(
              "relative bg-card rounded-xl border-2 border-primary/30 shadow-xl overflow-hidden",
              isFullscreen ? "w-full h-full" : "w-full max-w-4xl"
            )}>
              {/* Game Header */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-border">
                <h3 className="font-display font-bold">{selectedGame.name}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    className="h-8 w-8"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedGame(null);
                      setIsFullscreen(false);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Game iframe */}
              <div className="aspect-video bg-black">
                <iframe
                  id="game-iframe"
                  src={selectedGame.embedUrl}
                  className="w-full h-full border-0"
                  allow="fullscreen; autoplay; clipboard-write"
                  loading="lazy"
                  title={selectedGame.name}
                />
              </div>

              {/* Game Controls Hint */}
              <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
                Använd piltangenterna eller musen för att spela • Klicka på spelet för att aktivera
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="font-display"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="group relative overflow-hidden rounded-xl border-2 border-border bg-card transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div className="aspect-video overflow-hidden">
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>

              {/* Game Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-display font-bold text-sm text-foreground">{game.name}</h3>
                <span className="text-xs text-primary">{game.category}</span>
              </div>

              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors group-hover:bg-primary/20">
                <div className="p-3 rounded-full bg-primary/90 text-primary-foreground opacity-0 transform scale-50 transition-all group-hover:opacity-100 group-hover:scale-100">
                  <Gamepad2 className="w-6 h-6" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">🎮 Om Spelzonen</h3>
          <p className="text-sm text-muted-foreground">
            Här samlar vi klassiska HTML5-spel som fungerar direkt i webbläsaren! 
            Precis som förr i tiden när man spelade Flash-spel på skoldatorn. 
            Vissa spel kan ta några sekunder att ladda.
          </p>
        </div>
      </div>
    </div>
  );
}
