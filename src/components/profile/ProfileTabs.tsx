import { cn } from "@/lib/utils";

export type ProfileTabId = "profil" | "gastbok" | "blog" | "vanner" | "album" | "besokare";

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  isOwnProfile: boolean;
}

const baseTabs: { id: ProfileTabId; label: string }[] = [
  { id: "profil", label: "PROFIL" },
  { id: "gastbok", label: "GÄSTBOK" },
  { id: "blog", label: "BLOG" },
  { id: "vanner", label: "VÄNNER" },
  { id: "album", label: "ALBUM" },
];

export function ProfileTabs({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) {
  const tabs = isOwnProfile
    ? [...baseTabs, { id: "besokare" as ProfileTabId, label: "👀 SPANARE" }]
    : baseTabs;

  return (
    <div className="bg-card border-b border-[hsl(var(--lunar-box-border))]">
      <div className="container px-4">
        <nav className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "lunar-box-header text-white"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
