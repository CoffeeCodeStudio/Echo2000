import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, ArrowLeft, Mail, ExternalLink, UserX } from "lucide-react";

interface InactiveUser {
  user_id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  last_seen: string | null;
  days_inactive: number;
  friend_requests: number;
  guestbook_entries: number;
  profile_views: number;
}

function formatInactivity(totalDays: number): { text: string; emoji: string; colorClass: string } {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  let text: string;
  if (weeks === 0) {
    text = `${days} dagar`;
  } else if (days === 0) {
    text = `${weeks} ${weeks === 1 ? "vecka" : "veckor"}`;
  } else {
    text = `${weeks} ${weeks === 1 ? "vecka" : "veckor"} + ${days} ${days === 1 ? "dag" : "dagar"}`;
  }

  let emoji: string;
  let colorClass: string;
  if (totalDays < 7) {
    emoji = "🟢";
    colorClass = "text-green-400";
  } else if (totalDays < 14) {
    emoji = "🟠";
    colorClass = "text-orange-400";
  } else if (totalDays < 28) {
    emoji = "🔴";
    colorClass = "text-red-400";
  } else {
    emoji = "⚫";
    colorClass = "text-muted-foreground";
  }

  return { text, emoji, colorClass };
}

type FilterLevel = "all" | "1-2w" | "2-4w" | "4w+";

export default function AdminInactive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<FilterLevel>("all");

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchInactive = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_inactive_users");
      if (!error && data) {
        setUsers(data as InactiveUser[]);
      }
      setLoading(false);
    };
    fetchInactive();
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Du måste vara inloggad.</p>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Åtkomst nekad.</p>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    if (filter === "all") return true;
    if (filter === "1-2w") return u.days_inactive >= 7 && u.days_inactive < 14;
    if (filter === "2-4w") return u.days_inactive >= 14 && u.days_inactive < 28;
    if (filter === "4w+") return u.days_inactive >= 28;
    return true;
  });

  function buildMailto(u: InactiveUser) {
    const subject = encodeURIComponent(`Vi saknar dig på Echo2000, ${u.username}!`);
    const lines = [
      `Hej ${u.username}!`,
      "",
      `Det har gått ${formatInactivity(u.days_inactive).text} sedan du senast var online.`,
    ];
    if (u.friend_requests > 0) lines.push(`Du har ${u.friend_requests} väntande vänförfrågningar.`);
    if (u.guestbook_entries > 0) lines.push(`${u.guestbook_entries} nya gästboksinlägg väntar på dig.`);
    if (u.profile_views > 0) lines.push(`${u.profile_views} personer har besökt din profil.`);
    lines.push("", "Kom tillbaka och häng med oss! 🎉", "", "/ Echo2000-teamet");
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${u.email}?subject=${subject}&body=${body}`;
  }

  const FILTERS: { key: FilterLevel; label: string }[] = [
    { key: "all", label: "Alla" },
    { key: "1-2w", label: "1–2v" },
    { key: "2-4w", label: "2–4v" },
    { key: "4w+", label: "4v+" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Inaktiva användare</h1>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} användare
        </span>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Inga inaktiva användare i denna kategori.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u) => {
            const info = formatInactivity(u.days_inactive);
            return (
              <Card key={u.user_id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {u.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{u.username}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                    <p className={`text-sm ${info.colorClass}`}>
                      {info.emoji} {info.text}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {u.friend_requests > 0 && <span>🤝 {u.friend_requests} vänförfrågningar</span>}
                      {u.guestbook_entries > 0 && <span>📖 {u.guestbook_entries} gästbok</span>}
                      {u.profile_views > 0 && <span>👁️ {u.profile_views} profilbesök</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <a href={buildMailto(u)} target="_blank" rel="noopener noreferrer">
                        <Mail className="w-4 h-4 mr-1" />
                        Maila
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/profile/${encodeURIComponent(u.username)}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
