/**
 * @module ChatWelcomeScreen
 * Shown when no contact is selected — a friendly welcome splash.
 */
import { MsnLogo } from "./MsnLogo";

export function ChatWelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-card p-8">
      <MsnLogo size="lg" animated className="mb-4" />
      <h2 className="font-bold text-sm text-foreground mb-2">
        Välkommen till Echo Messenger!
      </h2>
      <p className="text-[11px] text-muted-foreground text-center max-w-md mb-4">
        Välj en kontakt från listan till vänster för att starta en konversation.
      </p>
      <div className="flex gap-2 text-[10px] text-[#ff6600] font-bold">
        <span>💬 Chatta</span>
        <span>•</span>
        <span>🎮 Spela</span>
        <span>•</span>
        <span>📞 Ring</span>
      </div>
    </div>
  );
}
