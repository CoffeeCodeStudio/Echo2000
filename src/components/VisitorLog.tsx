import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Visitor {
  id: string;
  username: string;
  avatar_url: string | null;
  visited_at: string;
}

interface VisitorLogProps {
  visitors: Visitor[];
  className?: string;
}

/**
 * Shows the 5 most recent profile visitors
 */
export function VisitorLog({ visitors, className }: VisitorLogProps) {
  const navigate = useNavigate();

  if (visitors.length === 0) {
    return (
      <div className={cn("p-3 bg-card rounded-lg border border-border", className)}>
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
          👀 Senaste besökare
        </h3>
        <p className="text-xs text-muted-foreground text-center py-3">
          Inga besökare ännu
        </p>
      </div>
    );
  }

  return (
    <div className={cn("p-3 bg-card rounded-lg border border-border", className)}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
        👀 Senaste besökare
      </h3>
      <div className="space-y-2">
        {visitors.slice(0, 5).map((visitor) => (
          <div 
            key={visitor.id} 
            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/profile/${encodeURIComponent(visitor.username)}`)}
          >
            <Avatar
              name={visitor.username}
              src={visitor.avatar_url || undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block hover:text-primary transition-colors">
                {visitor.username}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(visitor.visited_at), { 
                  addSuffix: true, 
                  locale: sv 
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
