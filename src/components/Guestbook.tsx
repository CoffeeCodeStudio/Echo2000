import { useState, useEffect } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { GoodVibe } from "./GoodVibe";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GuestbookEntry {
  id: string;
  author_name: string;
  author_avatar: string | null;
  message: string;
  created_at: string;
  user_id: string;
}

export function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch entries on mount
  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching guestbook entries:", error);
        toast({
          title: "Kunde inte hämta inlägg",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } else {
        setEntries(data || []);
      }
      setIsLoading(false);
    };

    fetchEntries();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("guestbook-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guestbook_entries",
        },
        (payload) => {
          setEntries((prev) => [payload.new as GuestbookEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;

    if (!user) {
      toast({
        title: "Logga in först",
        description: "Du måste vara inloggad för att skriva i gästboken",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Get user profile for username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .single();

      const authorName = profile?.username || user.email?.split("@")[0] || "Anonym";
      const avatarUrl = profile?.avatar_url || null;

      const { error } = await supabase.from("guestbook_entries").insert({
        user_id: user.id,
        author_name: authorName,
        author_avatar: avatarUrl,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Inlägg skickat!",
        description: "Ditt meddelande har lagts till i gästboken",
      });
    } catch (error) {
      console.error("Error posting to guestbook:", error);
      toast({
        title: "Kunde inte skicka",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `idag kl ${date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `igår kl ${date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} dagar sedan`;
    } else {
      return date.toLocaleDateString("sv-SE");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="nostalgia-card p-4 mb-6">
          <h1 className="font-display font-bold text-xl mb-1">📖 Min Gästbok</h1>
          <p className="text-sm text-muted-foreground">
            Lämna ett meddelande så svarar jag så fort jag kan!
          </p>
        </div>

        {/* Write new entry */}
        <div className="nostalgia-card p-4 mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Skriv i gästboken
          </h2>

          {!authLoading && !user ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Du måste vara inloggad för att skriva i gästboken
              </p>
              <Button variant="msn" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Skriv ditt meddelande här..."
                rows={3}
                className="mb-3"
                disabled={isSending}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {newMessage.length}/500 tecken
                </span>
                <Button
                  variant="msn"
                  onClick={handleSubmit}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Skicka
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="nostalgia-card p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Inga inlägg i gästboken än. Bli först att skriva!
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="nostalgia-card p-4">
                <div className="flex gap-3">
                  <Avatar name={entry.author_name} size="md" status="online" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{entry.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-foreground/90">{entry.message}</p>

                    {/* Actions - Good-Vibe replaces likes */}
                    <div className="flex items-center gap-4 mt-3">
                      <GoodVibe targetType="guestbook" targetId={entry.id} />
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        Svara
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
