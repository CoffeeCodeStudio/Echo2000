import { Avatar } from './Avatar';
import { AiBadge } from './AiBadge';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

const VISITORS_LAST_CHECKED_KEY = 'echo2000_visitors_last_checked';

interface Visitor {
  id: string;
  username: string;
  avatar_url: string | null;
  visited_at: string;
  is_bot?: boolean;
}

interface VisitorLogProps {
  visitors: Visitor[];
  className?: string;
}

function formatVisitTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Idag kl ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Igår kl ${format(date, 'HH:mm')}`;
  }
  return format(date, "d MMM 'kl' HH:mm", { locale: sv });
}

/**
 * Shows the most recent profile visitors — only visible to the profile owner.
 * Visitors that arrived after the last time the log was opened get a "NY" badge.
 */
export function VisitorLog({ visitors, className }: VisitorLogProps) {
  const navigate = useNavigate();
  const lastChecked = localStorage.getItem(VISITORS_LAST_CHECKED_KEY) || '1970-01-01T00:00:00Z';

  const isNew = (visitedAt: string) => new Date(visitedAt) > new Date(lastChecked);

  return (
    <div className={cn("", className)}>
      <div className="bg-card border border-border">
        {/* Gradient header */}
        <div className="lunar-box-header px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Senaste besökare
        </div>

        {visitors.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[11px] text-muted-foreground">
              Inga besökare ännu — dela din profil!
            </p>
          </div>
        ) : (
          <div>
            {visitors.map((visitor, i) => (
              <div
                key={visitor.id}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 border-b border-border last:border-b-0 cursor-pointer hover:bg-[#fff3e6] transition-colors group",
                  i % 2 === 0 ? "bg-card" : "bg-muted/40"
                )}
                onClick={() => navigate(`/profile/${encodeURIComponent(visitor.username)}`)}
              >
                <Avatar
                  name={visitor.username}
                  src={visitor.avatar_url || undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-foreground truncate flex items-center gap-1 group-hover:text-[#ff6600] transition-colors">
                    {visitor.username}
                    {visitor.is_bot && <AiBadge />}
                    {isNew(visitor.visited_at) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 animate-pulse">
                        NY
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatVisitTime(visitor.visited_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
