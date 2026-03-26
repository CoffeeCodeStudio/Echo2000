/**
 * @module HomeActivityFeed
 * Live feed of recent community activity — guestbook entries, new members,
 * klotter posts — to make the home page feel alive even when few are online.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Activity, BookOpen, UserPlus, Palette, MessageCircle } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "guestbook" | "member" | "klotter" | "news_comment";
  text: string;
  username: string;
  timestamp: string;
  link?: string;
}

const ICON_MAP = {
  guestbook: <BookOpen className="w-3.5 h-3.5 text-accent shrink-0" />,
  member: <UserPlus className="w-3.5 h-3.5 text-online shrink-0" />,
  klotter: <Palette className="w-3.5 h-3.5 text-primary shrink-0" />,
  news_comment: <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />,
};

function timeAgo(ts: string) {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: sv });
  } catch {
    return "";
  }
}

export function HomeActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivity = async () => {
      const results: ActivityItem[] = [];

      // Fetch latest guestbook entries
      const { data: guestbook } = await supabase
        .from("profile_guestbook")
        .select("id, author_name, created_at, profile_owner_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (guestbook) {
        // Get profile owner usernames
        const ownerIds = [...new Set(guestbook.map((g) => g.profile_owner_id))];
        const { data: owners } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", ownerIds);
        const ownerMap = new Map(owners?.map((o) => [o.user_id, o.username]) ?? []);

        for (const g of guestbook) {
          const ownerName = ownerMap.get(g.profile_owner_id) ?? "okänd";
          results.push({
            id: `gb-${g.id}`,
            type: "guestbook",
            text: `skrev i ${ownerName}s gästbok`,
            username: g.author_name,
            timestamp: g.created_at,
            link: `/profile/${encodeURIComponent(ownerName)}`,
          });
        }
      }

      // Fetch newest members
      const { data: newMembers } = await supabase
        .from("profiles")
        .select("user_id, username, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (newMembers) {
        for (const m of newMembers) {
          results.push({
            id: `mem-${m.user_id}`,
            type: "member",
            text: "gick med i Echo2000",
            username: m.username,
            timestamp: m.created_at,
            link: `/profile/${encodeURIComponent(m.username)}`,
          });
        }
      }

      // Fetch latest klotter
      const { data: klotter } = await supabase
        .from("klotter")
        .select("id, author_name, created_at, comment")
        .order("created_at", { ascending: false })
        .limit(4);

      if (klotter) {
        for (const k of klotter) {
          results.push({
            id: `kl-${k.id}`,
            type: "klotter",
            text: k.comment ? `klottrade: "${k.comment.slice(0, 30)}${k.comment.length > 30 ? "…" : ""}"` : "la upp en ny klotterteckning",
            username: k.author_name,
            timestamp: k.created_at,
          });
        }
      }

      // Fetch latest news comments
      const { data: comments } = await supabase
        .from("news_comments")
        .select("id, author_name, created_at, content")
        .order("created_at", { ascending: false })
        .limit(3);

      if (comments) {
        for (const c of comments) {
          results.push({
            id: `nc-${c.id}`,
            type: "news_comment",
            text: `kommenterade: "${c.content.slice(0, 25)}${c.content.length > 25 ? "…" : ""}"`,
            username: c.author_name,
            timestamp: c.created_at,
          });
        }
      }

      // Sort by timestamp descending, take top 8
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(results.slice(0, 6));
    };

    fetchActivity();
  }, []);

  return (
    <BentoCard title="Senaste Aktivitet" icon={<Activity className="w-4 h-4" />}>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Laddar aktivitet...</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.link && navigate(item.link)}
              className={`w-full flex items-start gap-2 text-left px-2 py-1.5 rounded transition-colors text-xs ${
                item.link ? "hover:bg-white/10 cursor-pointer" : "cursor-default"
              }`}
            >
              {ICON_MAP[item.type]}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-foreground">{item.username}</span>{" "}
                <span className="text-muted-foreground">{item.text}</span>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{timeAgo(item.timestamp)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
