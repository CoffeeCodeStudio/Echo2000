import { cn } from "@/lib/utils";
import { VOTE_CATEGORIES, type VoteCategory, type VoteCounts, type UserVotes } from "@/hooks/useFriendVotes";

interface PersonalityMeterProps {
  voteCounts: VoteCounts;
  userVotes: UserVotes;
  totalVotes: number;
  onToggleVote: (category: VoteCategory) => void;
  disabled?: boolean;
  loading?: boolean;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Bäst': '🏆',
  'Nörd': '🤓',
  'Cooling': '😎',
  'Hård som sten': '🪨',
  'Festis': '🎉',
  'Ball': '⚽',
  'Tuffing': '💪',
};

export function PersonalityMeter({
  voteCounts,
  userVotes,
  totalVotes,
  onToggleVote,
  disabled = false,
  loading = false,
}: PersonalityMeterProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Vad tycker vännerna?
      </p>
      {VOTE_CATEGORIES.map((category) => {
        const count = voteCounts[category] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const hasVoted = userVotes[category] || false;

        return (
          <button
            key={category}
            onClick={() => onToggleVote(category)}
            disabled={disabled || loading}
            className={cn(
              "w-full flex items-center gap-2 group transition-all px-2 py-1.5 text-left",
              "hover:bg-[#fff3e6]",
              hasVoted && "bg-[#fff3e6]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-sm w-5 text-center">{CATEGORY_EMOJIS[category]}</span>
            <span className={cn(
              "text-[11px] font-bold w-24 truncate",
              hasVoted ? "text-[#ff6600]" : "text-foreground"
            )}>
              {category}
            </span>
            <div className="flex-1 h-3 bg-muted border border-border/30 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  hasVoted
                    ? "bg-gradient-to-r from-[#ff6600] to-[#ff8533]"
                    : "bg-gradient-to-r from-[#ff6600]/30 to-[#ff6600]/15"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-10 text-right font-mono">
              {percentage}%
            </span>
          </button>
        );
      })}
      {totalVotes > 0 && (
        <p className="text-[10px] text-muted-foreground text-right mt-1">
          {totalVotes} röst{totalVotes !== 1 ? 'er' : ''} totalt
        </p>
      )}
    </div>
  );
}
