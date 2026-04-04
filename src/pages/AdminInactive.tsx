import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, ArrowLeft, Mail, ExternalLink, UserX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  if (weeks >= 4) return { text, emoji: "⚫", colorClass: "text-foreground font-bold" };
  if (weeks >= 2) return { text, emoji: "🔴", colorClass: "text-destructive font-semibold" };
  if (weeks >= 1) return { text, emoji: "🟠", colorClass: "text-orange-500 font-semibold" };
  return { text, emoji: "🟢", colorClass: "text-green-600" };
}

function buildMailtoLink(user: InactiveUser): string {
  const subject = `Hej ${user.username}, vi saknar dig på Echo2000! 💾`;
  const body = `Hej ${user.username}!\n\nVi såg att du inte varit inne på ett tag. Vad händer?\n\nSen sist:\n\n${user.friend_requests} nya vänförfrågningar\n${user.guestbook_entries} nya gästboksinlägg\n${user.profile_views} personer har kollat på din profil\n\nKom tillbaka och säg hej! 🚀\nLogga in: ${window.location.origin}\n\n/ Rami, Coffee Code Studio`;
  return `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AdminInactive() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user) { setCheckingAdmin(false); return; }
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        setIsAdmin(data === true);
      } catch { setIsAdmin(false); }
      finally { setCheckingAdmin(false); }
    };
    if (!authLoading) check();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_inactive_users");
      if (!error && data) setUsers(data as unknown as InactiveUser[]);
      setLoading(false);
    };
    fetch();
  }, [isAdmin]);

  if (authLoading || checkingAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="nostalgia-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Åtkomst nekad</h1>
          <p className="text-muted-foreground mb-4">Endast administratörer har åtkomst.</p>
          <Button onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />Tillbaka</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              <UserX className="w-6 h-6 text-primary" />Inaktiva användare
            </h1>
            <p className="text-muted-foreground text-sm">
              {users.length} användare har inte loggat in på 7+ dagar
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Admin
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">🎉 Alla användare är aktiva!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const inactivity = formatInactivity(u.days_inactive);
              return (
                <Card key={u.user_id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <Avatar className="w-16 h-20 rounded-lg shrink-0">
                        <AvatarImage src={u.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="rounded-lg text-lg">
                          {u.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-lg truncate">{u.username}</p>
                            <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <a
                            href={`/profile/${u.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>

                        {/* Inactivity */}
                        <p className={`text-base ${inactivity.colorClass}`}>
                          {inactivity.emoji} {inactivity.text} sen senaste login
                        </p>

                        {/* Activity counts */}
                        <p className="text-sm text-muted-foreground">
                          {u.friend_requests > 0 && <span className="font-medium">{u.friend_requests} vänförfrågningar</span>}
                          {u.friend_requests > 0 && (u.guestbook_entries > 0 || u.profile_views > 0) && " • "}
                          {u.guestbook_entries > 0 && <span className="font-medium">{u.guestbook_entries} gästbok</span>}
                          {u.guestbook_entries > 0 && u.profile_views > 0 && " • "}
                          {u.profile_views > 0 && <span className="font-medium">{u.profile_views} vyer</span>}
                          {u.friend_requests === 0 && u.guestbook_entries === 0 && u.profile_views === 0 && (
                            <span>Ingen ny aktivitet</span>
                          )}
                        </p>

                        {/* Mail button */}
                        <a href={buildMailtoLink(u)}>
                          <Button size="sm" variant="outline" className="mt-1">
                            <Mail className="w-4 h-4 mr-1" />📧 Skicka mail
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
