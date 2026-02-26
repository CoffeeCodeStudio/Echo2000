/**
 * @module KlotterHeader
 * Tab switcher and header bar for the Klotterplanket.
 */
import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface KlotterHeaderProps {
  isMobile: boolean;
  activeTab: "draw" | "gallery";
  onTabChange: (tab: "draw" | "gallery") => void;
  canPublish: boolean;
  onPublish: () => void;
  galleryCount: number;
}

function TabSwitcher({
  activeTab,
  onTabChange,
  isMobile,
  galleryCount,
  className,
}: {
  activeTab: "draw" | "gallery";
  onTabChange: (tab: "draw" | "gallery") => void;
  isMobile: boolean;
  galleryCount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 bg-muted rounded-lg p-1", className)}>
      {(["draw", "gallery"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            activeTab === tab
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab === "draw"
            ? isMobile
              ? "🎨 Rita"
              : "Rita"
            : isMobile
              ? "🖼️ Galleri"
              : `Galleri (${galleryCount})`}
        </button>
      ))}
    </div>
  );
}

export function KlotterHeader({
  isMobile,
  activeTab,
  onTabChange,
  canPublish,
  onPublish,
  galleryCount,
}: KlotterHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-border",
        isMobile ? "p-3 flex items-center justify-between" : "p-4"
      )}
    >
      {!isMobile && (
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display font-bold text-xl flex items-center gap-2">
            🎨 Klotterplanket
          </h1>
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={onTabChange}
            isMobile={isMobile}
            galleryCount={galleryCount}
          />
        </div>
      )}

      {isMobile && (
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={onTabChange}
          isMobile={isMobile}
          galleryCount={galleryCount}
        />
      )}

      {isMobile && activeTab === "draw" && (
        <Button
          size="sm"
          onClick={onPublish}
          disabled={!canPublish}
          className="gap-1 text-xs bg-primary"
        >
          <Send className="w-3 h-3" />
          Publicera
        </Button>
      )}

      {!isMobile && (
        <p className="text-sm text-muted-foreground">
          {activeTab === "draw"
            ? "Rita, klottra och publicera!"
            : "Se vad andra har klottrat"}
        </p>
      )}
    </div>
  );
}
