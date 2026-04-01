import { useState, useEffect } from "react";
import { Mail, Send, Inbox, Star, Trash2, ArrowLeft, Reply, Info, Loader2, Users } from "lucide-react";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MailMessage {
  id: string;
  from: string;
  fromAvatar?: string;
  fromUserId: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
}

interface RecipientOption {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

// No demo data - only real messages from database

type MailView = "inbox" | "compose" | "read";

interface MailboxProps {
  onUnreadCountChange?: (count: number) => void;
  initialRecipient?: string;
}

export function Mailbox({ onUnreadCountChange, initialRecipient }: MailboxProps) {
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [view, setView] = useState<MailView>("inbox");
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [composeData, setComposeData] = useState({ to: initialRecipient || "", subject: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState<RecipientOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoggedOut = !authLoading && !user;

  // Fetch mails from database
  useEffect(() => {
    if (isLoggedOut) {
      setMails([]);
      setLoading(false);
      return;
    }

    if (!user) {
      setMails([]);
      setLoading(false);
      return;
    }

    const fetchMails = async () => {
      setLoading(true);
      try {
        // Get messages where user is recipient
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_id", user.id)
          .eq("deleted_by_recipient", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
          setMails([]);
          setLoading(false);
          return;
        }

        // Get sender profiles using .or() for better RLS compatibility
        const senderIds = [...new Set(messages.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .or(senderIds.map(id => `user_id.eq.${id}`).join(","));

        const fetchedMap = new Map<string, { username: string; avatar_url: string | null }>();
        profiles?.forEach((p) => fetchedMap.set(p.user_id, { username: p.username, avatar_url: p.avatar_url }));

        // Mark truly missing senders
        senderIds.forEach((id) => {
          if (!fetchedMap.has(id)) {
            fetchedMap.set(id, { username: "Borttagen användare", avatar_url: null });
          }
        });

        // Map to MailMessage format
        const mailList: MailMessage[] = messages.map((msg) => {
          const sender = fetchedMap.get(msg.sender_id);
          const createdAt = new Date(msg.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

          let timestamp: string;
          if (diffDays === 0) {
            timestamp = createdAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
          } else if (diffDays === 1) {
            timestamp = "igår";
          } else if (diffDays < 7) {
            timestamp = `${diffDays} dagar sedan`;
          } else {
            timestamp = createdAt.toLocaleDateString("sv-SE");
          }

          return {
            id: msg.id,
            from: sender?.username || "Borttagen användare",
            fromAvatar: sender?.avatar_url || undefined,
            fromUserId: msg.sender_id,
            subject: msg.subject,
            preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
            content: msg.content,
            timestamp,
            isRead: msg.is_read,
            isStarred: msg.is_starred,
          };
        });

        setMails(mailList);
      } catch (error) {
        console.error("Error fetching mails:", error);
        toast({
          title: "Kunde inte hämta mejl",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMails();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchMails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoggedOut, toast]);

  // Report unread count to parent
  const unreadCount = mails.filter((m) => !m.isRead).length;
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Search recipients
  const handleRecipientSearch = async (query: string) => {
    setComposeData({ ...composeData, to: query });

    if (!query.trim() || !user) {
      setRecipientSearch([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("user_id", user.id)
        .limit(5);

      setRecipientSearch(data || []);
    } catch (error) {
      console.error("Error searching recipients:", error);
    }
  };

  const openMail = async (mail: MailMessage) => {
    if (isLoggedOut) return;
    setSelectedMail(mail);
    setView("read");

    // Mark as read
    if (!mail.isRead && user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", mail.id);

      setMails((prev) =>
        prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
      );
    }
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoggedOut || !user) return;

    const mail = mails.find((m) => m.id === id);
    if (!mail) return;

    await supabase
      .from("messages")
      .update({ is_starred: !mail.isStarred })
      .eq("id", id);

    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  const handleSend = async () => {
    if (!user || !selectedRecipient) return;

    if (!composeData.subject.trim() || !composeData.message.trim()) {
      toast({
        title: "Fyll i alla fält",
        description: "Ämne och meddelande krävs",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedRecipient.user_id,
        subject: composeData.subject.trim(),
        content: composeData.message.trim(),
      });

      if (error) throw error;

      toast({
        title: "Mejl skickat!",
        description: `Meddelande skickat till ${selectedRecipient.username}`,
      });

      setComposeData({ to: "", subject: "", message: "" });
      setSelectedRecipient(null);
      setView("inbox");
    } catch (error) {
      console.error("Error sending mail:", error);
      toast({
        title: "Kunde inte skicka",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMail || !user) return;

    try {
      await supabase
        .from("messages")
        .update({ deleted_by_recipient: true })
        .eq("id", selectedMail.id);

      setMails((prev) => prev.filter((m) => m.id !== selectedMail.id));
      setView("inbox");
      setSelectedMail(null);

      toast({
        title: "Mejl raderat",
      });
    } catch (error) {
      console.error("Error deleting mail:", error);
    }
  };

  const handleReply = () => {
    if (!selectedMail) return;
    
    // Find the sender's profile to set as recipient
    setSelectedRecipient({
      user_id: selectedMail.fromUserId,
      username: selectedMail.from,
      avatar_url: selectedMail.fromAvatar || null,
    });
    
    setComposeData({
      to: selectedMail.from,
      subject: `Re: ${selectedMail.subject}`,
      message: "",
    });
    setView("compose");
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-4 max-w-2xl mx-auto">
        {/* Login prompt for logged out users */}
        {isLoggedOut && (
          <div className="glass-card p-2.5 mb-3 border-[#ff6600]/30 bg-[#fff3e6]">
            <div className="flex items-center gap-2 text-[11px]">
              <Info className="w-3.5 h-3.5 text-[#ff6600]" />
              <span className="text-foreground">
                <button onClick={() => navigate("/auth")} className="text-[#ff6600] hover:underline font-bold">Logga in</button> för att se din inkorg!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="glass-card mb-3">
          <div className="lunar-box-header flex items-center gap-1.5 px-2.5 py-1.5">
            <Mail className="w-3.5 h-3.5 text-white/90" />
            <h1 className="font-bold text-[11px] tracking-wide uppercase flex-1">Mejl</h1>
            {view === "inbox" && !isLoggedOut && (
              <button
                onClick={() => setView("compose")}
                className="btn-nostalgic flex items-center gap-1 text-[10px] py-0.5 px-2"
              >
                <Send className="w-3 h-3" />
                Skriv nytt
              </button>
            )}
            {view === "inbox" && isLoggedOut && (
              <button onClick={() => navigate("/auth")} className="btn-nostalgic text-[10px] py-0.5 px-2">
                Logga in
              </button>
            )}
          </div>
          <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground bg-[hsl(var(--muted))] border-b border-border">
            {loading ? "Laddar..." : unreadCount > 0 ? `${unreadCount} olästa meddelanden` : "Inga nya meddelanden"}
          </div>
        </div>

        {/* Back button for non-inbox views */}
        {view !== "inbox" && (
          <button
            className="flex items-center gap-1 text-[11px] font-bold text-[#ff6600] hover:underline mb-2"
            onClick={() => {
              setView("inbox");
              setSelectedMail(null);
              setSelectedRecipient(null);
              setRecipientSearch([]);
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tillbaka till inkorg
          </button>
        )}

        {/* Loading state */}
        {loading && !isLoggedOut && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#ff6600]" />
          </div>
        )}

        {/* Inbox View */}
        {view === "inbox" && !loading && (
          <div className="glass-card overflow-hidden max-w-full">
            <div className="lunar-box-header flex items-center gap-1.5 px-2.5 py-1.5">
              <Inbox className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-[11px] tracking-wide uppercase">Inkorg</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 text-[9px] font-bold bg-white/20 text-white rounded-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              {mails.length === 0 ? (
                <div className="p-6 text-center bg-[hsl(var(--card))]">
                  <Mail className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-[12px] font-bold text-muted-foreground mb-0.5">🌟 Här var det tomt!</p>
                  <p className="text-[11px] text-muted-foreground">Nya meddelanden dyker upp här</p>
                </div>
              ) : (
                mails.map((mail, i) => (
                  <button
                    key={mail.id}
                    onClick={() => openMail(mail)}
                    className={cn(
                      "w-full text-left px-2.5 py-2 flex items-start gap-2.5 transition-colors border-b border-border text-[11px]",
                      i % 2 === 0 ? "bg-[hsl(var(--card))]" : "bg-[hsl(var(--muted))]",
                      !mail.isRead && "bg-[#fff3e6] font-bold",
                      "hover:bg-[#fff3e6]",
                      isLoggedOut && "cursor-default opacity-80"
                    )}
                    disabled={isLoggedOut}
                  >
                    <Avatar name={mail.from} src={mail.fromAvatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[11px]", !mail.isRead && "font-bold text-foreground")}>
                          {mail.from}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{mail.timestamp}</span>
                      </div>
                      <p className={cn("text-[11px] truncate", !mail.isRead ? "text-foreground" : "text-muted-foreground")}>
                        {mail.subject}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{mail.preview}</p>
                    </div>
                    <button
                      onClick={(e) => toggleStar(mail.id, e)}
                      className={cn(
                        "p-0.5 transition-colors flex-shrink-0",
                        mail.isStarred ? "text-[#ff6600]" : "text-muted-foreground hover:text-[#ff6600]",
                        isLoggedOut && "pointer-events-none"
                      )}
                      disabled={isLoggedOut}
                    >
                      <Star className={cn("w-3.5 h-3.5", mail.isStarred && "fill-current")} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Read Mail View */}
        {view === "read" && selectedMail && (
          <div className="glass-card overflow-hidden">
            <div className="lunar-box-header flex items-center gap-1.5 px-2.5 py-1.5">
              <Mail className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-[11px] tracking-wide uppercase truncate">{selectedMail.subject}</span>
            </div>
            <div className="px-2.5 py-2.5">
              <div className="flex items-start gap-2.5 mb-3 pb-2.5 border-b border-border">
                <div className="cursor-pointer" onClick={() => navigate(`/profile/${encodeURIComponent(selectedMail.from)}`)}>
                  <Avatar name={selectedMail.from} src={selectedMail.fromAvatar} size="md" />
                </div>
                <div className="flex-1 text-[11px]">
                  <p className="font-bold text-foreground hover:text-[#ff6600] cursor-pointer transition-colors" onClick={() => navigate(`/profile/${encodeURIComponent(selectedMail.from)}`)}>{selectedMail.from}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedMail.timestamp}</p>
                </div>
              </div>
              <div className="text-[11px] text-foreground whitespace-pre-line break-words [overflow-wrap:anywhere] [word-break:break-word] min-h-[60px]">
                {selectedMail.content}
              </div>
              <div className="flex gap-1.5 mt-4 pt-2.5 border-t border-border">
                <button onClick={handleReply} className="btn-nostalgic flex items-center gap-1 text-[10px]">
                  <Reply className="w-3 h-3" />
                  Svara
                </button>
                <button onClick={handleDelete} className="btn-nostalgic flex items-center gap-1 text-[10px] bg-[#999] border-[#777]">
                  <Trash2 className="w-3 h-3" />
                  Radera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compose View */}
        {view === "compose" && (
          <div className="glass-card overflow-hidden">
            <div className="lunar-box-header flex items-center gap-1.5 px-2.5 py-1.5">
              <Send className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-[11px] tracking-wide uppercase">Skriv nytt mejl</span>
            </div>
            <div className="px-2.5 py-2.5 space-y-3 text-[11px]">
              <div className="relative">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Till</label>
                {selectedRecipient ? (
                  <div className="flex items-center gap-2 mt-1 p-1.5 bg-[hsl(var(--muted))] border border-border">
                    <Avatar name={selectedRecipient.username} src={selectedRecipient.avatar_url} size="sm" />
                    <span className="text-[11px] font-bold">{selectedRecipient.username}</span>
                    <button
                      className="ml-auto text-muted-foreground hover:text-[#ff6600] text-[14px] font-bold px-1"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setComposeData({ ...composeData, to: "" });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      value={composeData.to}
                      onChange={(e) => handleRecipientSearch(e.target.value)}
                      placeholder="Sök användarnamn..."
                      className="mt-1 text-[11px] h-7"
                    />
                    {recipientSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-0 bg-[hsl(var(--card))] border border-border shadow-md">
                        {recipientSearch.map((recipient, i) => (
                          <button
                            key={recipient.user_id}
                            onClick={() => {
                              setSelectedRecipient(recipient);
                              setComposeData({ ...composeData, to: recipient.username });
                              setRecipientSearch([]);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#fff3e6] transition-colors text-left text-[11px]",
                              i % 2 === 0 ? "bg-[hsl(var(--card))]" : "bg-[hsl(var(--muted))]"
                            )}
                          >
                            <Avatar name={recipient.username} src={recipient.avatar_url} size="sm" />
                            <span>{recipient.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Ämne</label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Skriv ämne..."
                  className="mt-1 text-[11px] h-7"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Meddelande</label>
                <Textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  placeholder="Skriv ditt meddelande..."
                  rows={6}
                  className="mt-1 text-[11px]"
                  maxLength={5000}
                />
                <span className="text-[10px] text-muted-foreground">{composeData.message.length}/5000</span>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  className="btn-nostalgic bg-[#999] border-[#777] text-[10px]"
                  onClick={() => {
                    setView("inbox");
                    setSelectedRecipient(null);
                    setRecipientSearch([]);
                    setComposeData({ to: "", subject: "", message: "" });
                  }}
                >
                  Avbryt
                </button>
                <button
                  className="btn-nostalgic flex items-center gap-1 text-[10px]"
                  onClick={handleSend}
                  disabled={sending || !selectedRecipient || !composeData.subject.trim() || !composeData.message.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Skicka
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
