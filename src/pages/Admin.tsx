import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Shield, ArrowLeft, UserPlus } from "lucide-react";
import { z } from "zod";

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
}

export default function Admin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

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
        .select("*")
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
      // Create user via signUp (admin creates account for friend)
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
        // Assign 'user' role to the new user
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: 'user',
        });

        toast({
          title: "Användare skapad!",
          description: `${username} kan nu logga in med ${email}`,
        });

        // Reset form
        setUsername("");
        setEmail("");
        setPassword("");

        // Refresh user list
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin-panel
            </h1>
            <p className="text-muted-foreground text-sm">
              Hantera användare och inställningar
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create User Form */}
          <div className="nostalgia-card p-6">
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

          {/* User List */}
          <div className="nostalgia-card p-6">
            <h2 className="font-semibold text-lg mb-4">Registrerade användare</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-nostalgic">
              {users.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Inga användare ännu
                </p>
              ) : (
                users.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrerad {new Date(profile.created_at).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
