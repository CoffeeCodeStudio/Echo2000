/**
 * @module ReportButton
 * Reusable report button that sends a notification to all admins via BotAdam.
 */
import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReportButtonProps {
  /** What type of content is being reported */
  contentType: "profil" | "gästboksinlägg" | "klotter" | "kommentar";
  /** ID of the content being reported */
  contentId: string;
  /** Username or label for the content author */
  contentAuthor: string;
  /** Optional preview of the content */
  contentPreview?: string;
  /** Visual variant */
  variant?: "ghost" | "icon";
  /** Extra class names */
  className?: string;
}

export function ReportButton({
  contentType,
  contentId,
  contentAuthor,
  contentPreview,
  variant = "ghost",
  className,
}: ReportButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const handleReport = async () => {
    if (!reason.trim()) {
      toast({ title: "Ange en anledning", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      // Get reporter's username
      const { data: reporter } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get BotAdam's user_id
      const { data: botAdam } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", "BotAdam")
        .maybeSingle();

      const senderId = botAdam?.user_id ?? user.id;
      const reporterName = reporter?.username ?? "Okänd";

      // Get all admin user IDs
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!admins || admins.length === 0) {
        toast({ title: "Kunde inte skicka rapporten", description: "Inga administratörer hittades.", variant: "destructive" });
        setSending(false);
        return;
      }

      const subject = `🚩 Rapport: ${contentType} av ${contentAuthor}`;
      const content =
        `En användare har rapporterat innehåll.\n\n` +
        `📋 Typ: ${contentType}\n` +
        `👤 Rapporterat av: ${reporterName}\n` +
        `🎯 Innehållets författare: ${contentAuthor}\n` +
        `🆔 Innehålls-ID: ${contentId}\n` +
        (contentPreview ? `📝 Förhandsgranskning: "${contentPreview.slice(0, 100)}${contentPreview.length > 100 ? "…" : ""}"\n` : "") +
        `\n💬 Anledning:\n${reason}`;

      // Send message to all admins
      const inserts = admins.map((admin) => ({
        sender_id: senderId,
        recipient_id: admin.user_id,
        subject,
        content,
      }));

      const { error } = await supabase.from("messages").insert(inserts);
      if (error) throw error;

      toast({ title: "Rapport skickad", description: "Tack! En admin kommer att granska ärendet." });
      setReason("");
      setOpen(false);
    } catch (err) {
      console.error("Report error:", err);
      toast({ title: "Något gick fel", description: "Försök igen senare.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className={className ?? "h-6 w-6 text-muted-foreground hover:text-destructive"}
          onClick={() => setOpen(true)}
          title="Rapportera"
        >
          <Flag className="w-3 h-3" />
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={className ?? "flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"}
          title="Rapportera"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rapportera</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              Rapportera {contentType}
            </DialogTitle>
            <DialogDescription>
              Beskriv varför du vill rapportera detta innehåll. En administratör kommer att granska ärendet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ange anledning..."
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleReport} disabled={sending || !reason.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Flag className="w-4 h-4 mr-1" />}
              Skicka rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
