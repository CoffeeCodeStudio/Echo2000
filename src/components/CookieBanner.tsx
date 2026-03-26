import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";

const COOKIE_KEY = "echo2000_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-xl mx-auto bg-card border border-border rounded-lg p-4 shadow-lg space-y-3">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm text-foreground font-medium">
              Echo2000 använder cookies
            </p>
            <p className="text-xs text-muted-foreground">
              Vi använder <strong>endast nödvändiga cookies</strong> för att hålla dig inloggad och komma ihåg dina inställningar. Inga spårningscookies, ingen reklam, ingen tredjepartsdelning.
            </p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Dölj detaljer" : "Visa detaljer om våra cookies"}
        </button>

        {expanded && (
          <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded p-3 space-y-2">
            <p><strong className="text-foreground">Sessionscookie (sb-*)</strong> — Håller dig inloggad. Försvinner när du stänger webbläsaren eller loggar ut.</p>
            <p><strong className="text-foreground">Samtycke (echo2000_cookie_consent)</strong> — Sparar ditt val i denna ruta. Kvarstår tills du rensar webbläsardata.</p>
            <p><strong className="text-foreground">Inställningar</strong> — Sparar dina preferenser (t.ex. tema, ljudinställningar) lokalt i din webbläsare (localStorage).</p>
            <p className="pt-1 border-t border-border">
              Vi använder <strong>inga</strong> tredjepartscookies (Google Analytics, Facebook Pixel, reklam-trackers etc.). 
              Läs mer i vår{" "}
              <a href="/regler" className="text-primary hover:underline">integritetspolicy</a>.
            </p>
          </div>
        )}

        {/* Buttons — visually equal per IMY 2025 requirements */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={decline}
          >
            Neka
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={accept}
          >
            Godkänn
          </Button>
        </div>
      </div>
    </div>
  );
}
