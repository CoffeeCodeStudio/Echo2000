import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenord måste vara minst 6 tecken" }),
});

const signupSchema = loginSchema.extend({
  username: z.string().trim().min(2, { message: "Användarnamn måste vara minst 2 tecken" }).max(50),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? { email, password } : { email, password, username };
    
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; username?: string } = {};
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Inloggning misslyckades",
              description: "Fel e-post eller lösenord",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fel",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Välkommen tillbaka!",
            description: "Du är nu inloggad",
          });
        }
      } else {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Konto finns redan",
              description: "Denna e-post är redan registrerad. Försök logga in istället.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fel",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Konto skapat!",
            description: "Välkommen till Echo2000!",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display font-black text-3xl tracking-tight mb-2">
            <span className="text-foreground">ECHO</span>
            <span className="text-accent-foreground bg-accent px-2 rounded">2000</span>
          </div>
          <p className="text-muted-foreground text-sm">Nostalgi på riktigt</p>
        </div>

        {/* Login/Signup Card */}
        <div className="nostalgia-card p-6">
          <div className="flex gap-2 mb-6">
            <Button
              variant={isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(true)}
            >
              Logga in
            </Button>
            <Button
              variant={!isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(false)}
            >
              Registrera
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Användarnamn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ditt användarnamn"
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
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
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
                  {isLogin ? "Loggar in..." : "Skapar konto..."}
                </>
              ) : isLogin ? (
                "Logga in"
              ) : (
                "Skapa konto"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
