import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "../Avatar";
import { ClickableUsername } from "../ClickableUsername";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Trash2, MessageSquare, Send } from "lucide-react";
import { formatTimeAgo } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

interface NewsCommentsProps {
  articleId: string;
}

export function NewsComments({ articleId }: NewsCommentsProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`news-comments-${articleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_comments", filter: `article_id=eq.${articleId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [articleId]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(!!(data && data.length > 0));
    });
  }, [user]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("news_comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as Comment[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !profile || !newComment.trim()) return;
    if (newComment.trim().length > 1000) {
      toast({ title: "För lång kommentar", description: "Max 1000 tecken.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("news_comments").insert({
      article_id: articleId,
      user_id: user.id,
      author_name: profile.username,
      author_avatar: profile.avatar_url,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: "Kunde inte skicka", description: "Försök igen.", variant: "destructive" });
    } else {
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("news_comments").delete().eq("id", commentId);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm text-foreground">Kommentarer ({comments.length})</h3>
      </div>

      {/* Comment list */}
      <div className="space-y-3 mb-4">
        {loading ? (
          <p className="text-xs text-muted-foreground">Laddar kommentarer...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Inga kommentarer ännu. Bli först!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Avatar name={c.author_name} src={c.author_avatar || undefined} size="sm" className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0 bg-muted/30 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClickableUsername username={c.author_name} className="text-xs font-bold text-foreground" />
                    <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                  </div>
                  {user && (c.user_id === user.id || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      {user ? (
        <div className="flex gap-2">
          <Avatar name={profile?.username || ""} src={profile?.avatar_url || undefined} size="sm" className="mt-1 shrink-0" />
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Skriv en kommentar..."
              className="min-h-[60px] text-sm resize-none bg-muted/20"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[10px] text-muted-foreground">{newComment.length}/1000</span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="gap-1"
              >
                <Send className="w-3 h-3" />
                {submitting ? "Skickar..." : "Kommentera"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Logga in för att kommentera.
        </p>
      )}
    </div>
  );
}
