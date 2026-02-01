import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Shield, ArrowLeft, UserPlus, Search, Users, Activity, Trash2, Ban, Edit2 } from "lucide-react";
import { z } from "zod";
import { Avatar } from "@/components/Avatar";

const createUserSchema = z.object({
  username: z.string().trim().min(2, { message: "Namn måste vara minst 2 tecken" }).max(50),
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenord måste vara minst 6 tecken" }),
});

interface Profile {
  id: string;
  username: string;
  user_id: string;
  created_at: string;
  avatar_url: string | null;
  city: string | null;
  status_message: string | null;
}

export default function Admin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const [activeTab, setActiveTab] = useState<"create" | "list" | "stats">("list");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;
        setIsAdmin(data === true);
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, user_id, created_at, avatar_url, city, status_message")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const validateForm = () => {
    const result = createUserSchema.safeParse({ username, email, password });
    if (!result.success) {
      const fieldErrors: { username?: string; email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "E-post redan registrerad",
            description: "Denna e-postadress har redan ett konto.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Fel",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: 'user',
        });

        toast({
          title: "Användare skapad!",
          description: `${username} kan nu logga in med ${email}`,
        });

        setUsername("");
        setEmail("");
        setPassword("");

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, user_id, created_at, avatar_url, city, status_message")
          .order("created_at", { ascending: false });

        if (profiles) {
          setUsers(profiles);
        }
      }
    } catch (err) {
      toast({
        title: "Något gick fel",
        description: "Kunde inte skapa användare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGuestbookEntries = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("guestbook_entries")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Inlägg raderade",
        description: `Alla gästboksinlägg från ${username} har raderats`,
      });
    } catch (error) {
      toast({
        title: "Kunde inte radera",
        description: "Något gick fel",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    newThisMonth: users.filter((u) => {
      const created = new Date(u.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    onlineNow: 35, // Placeholder - would need realtime presence
  };

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="nostalgia-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">Inloggning krävs</h1>
          <p className="text-muted-foreground mb-4">
            Du måste vara inloggad för att komma åt admin-panelen.
          </p>
          <Button onClick={() => navigate("/auth")}>Logga in</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="nostalgia-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Åtkomst nekad</h1>
          <p className="text-muted-foreground mb-4">
            Du har inte behörighet att se denna sida. Endast administratörer har åtkomst.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin-panel
            </h1>
            <p className="text-muted-foreground text-sm">
              Hantera användare och innehåll
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="nostalgia-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Totalt medlemmar</p>
            </div>
          </div>
          <div className="nostalgia-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              <p className="text-sm text-muted-foreground">Nya denna månad</p>
            </div>
          </div>
          <div className="nostalgia-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.onlineNow}</p>
              <p className="text-sm text-muted-foreground">Online just nu</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            onClick={() => setActiveTab("list")}
          >
            <Users className="w-4 h-4 mr-2" />
            Medlemmar
          </Button>
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Skapa användare
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "list" && (
          <div className="nostalgia-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Alla medlemmar</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Sök användare..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-nostalgic">
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Inga användare hittades
                </p>
              ) : (
                filteredUsers.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar 
                      name={profile.username} 
                      src={profile.avatar_url} 
                      size="md" 
                    />
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/profile/${encodeURIComponent(profile.username)}`)}
                      >
                        {profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.city && `${profile.city} • `}
                        Registrerad {new Date(profile.created_at).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/profile/${encodeURIComponent(profile.username)}`)}
                        title="Visa profil"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteGuestbookEntries(profile.user_id, profile.username)}
                        disabled={actionLoading === profile.user_id}
                        title="Radera användarens gästboksinlägg"
                      >
                        {actionLoading === profile.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="nostalgia-card p-6 max-w-md">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Skapa ny användare
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Namn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Vännens namn"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive text-sm">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="van@email.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Skapa användare
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
