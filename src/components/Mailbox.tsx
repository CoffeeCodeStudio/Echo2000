import { useState } from "react";
import { Mail, Send, Inbox, Star, Trash2, ArrowLeft, Reply } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

interface MailMessage {
  id: string;
  from: string;
  fromAvatar?: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
}

const initialMails: MailMessage[] = [
  {
    id: "1",
    from: "Emma",
    subject: "Kommer du på festen?",
    preview: "Hej! Jag undrar om du tänkte komma på lördagens fest...",
    content: "Hej!\n\nJag undrar om du tänkte komma på lördagens fest hos mig? Det blir massa folk från gamla gänget. Skulle vara jättekul om du kunde komma!\n\nKram,\nEmma",
    timestamp: "14:32",
    isRead: false,
    isStarred: true,
  },
  {
    id: "2",
    from: "Johan",
    subject: "Re: Gaming ikväll?",
    preview: "Absolut! Jag är online efter 20...",
    content: "Absolut! Jag är online efter 20. Ska vi köra lite retro-spel? Har laddat ner en massa gamla klassiker!\n\n/Johan",
    timestamp: "igår",
    isRead: true,
    isStarred: false,
  },
  {
    id: "3",
    from: "Lisa",
    subject: "Titta på bilderna! 📸",
    preview: "Hej! Jag la upp bilderna från förra helgen...",
    content: "Hej!\n\nJag la upp bilderna från förra helgen i mitt album. Kolla in dem när du har tid! Det blev några riktigt fina.\n\n💕 Lisa",
    timestamp: "mån",
    isRead: false,
    isStarred: false,
  },
  {
    id: "4",
    from: "Admin",
    subject: "Välkommen tillbaka!",
    preview: "Vi har saknat dig! Kolla in vad som är nytt...",
    content: "Hej och välkommen tillbaka till NostalgiaChat!\n\nVi har saknat dig! Kolla in vad som är nytt sedan sist:\n\n• Ny gästboksfunktion\n• Förbättrad chatt\n• Fler profilanpassningar\n\nMvh,\nTeamet",
    timestamp: "förra veckan",
    isRead: true,
    isStarred: false,
  },
  {
    id: "5",
    from: "Marcus",
    subject: "Kolla denna länk!",
    preview: "Hittade något du kanske gillar...",
    content: "Yo!\n\nHittade denna sida som samlar alla gamla MSN-ljud och bakgrunder. Nostalgi på riktigt!\n\nKolla in det!\n\n/Marcus",
    timestamp: "förra veckan",
    isRead: true,
    isStarred: true,
  },
];

type MailView = "inbox" | "compose" | "read";

export function Mailbox() {
  const [mails, setMails] = useState<MailMessage[]>(initialMails);
  const [view, setView] = useState<MailView>("inbox");
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [composeData, setComposeData] = useState({ to: "", subject: "", message: "" });

  const unreadCount = mails.filter(m => !m.isRead).length;

  const openMail = (mail: MailMessage) => {
    setSelectedMail(mail);
    setMails(mails.map(m => m.id === mail.id ? { ...m, isRead: true } : m));
    setView("read");
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMails(mails.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const handleSend = () => {
    // Simulate sending
    setComposeData({ to: "", subject: "", message: "" });
    setView("inbox");
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Mejl
              </h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} olästa meddelanden` : "Inga nya meddelanden"}
              </p>
            </div>
            {view === "inbox" && (
              <Button variant="msn" onClick={() => setView("compose")}>
                <Send className="w-4 h-4 mr-2" />
                Skriv nytt
              </Button>
            )}
          </div>
        </div>

        {/* Back button for non-inbox views */}
        {view !== "inbox" && (
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setView("inbox")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till inkorg
          </Button>
        )}

        {/* Inbox View */}
        {view === "inbox" && (
          <div className="nostalgia-card overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
              <Inbox className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Inkorg</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {mails.map((mail) => (
                <button
                  key={mail.id}
                  onClick={() => openMail(mail)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3",
                    !mail.isRead && "bg-primary/5"
                  )}
                >
                  <Avatar name={mail.from} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm", !mail.isRead && "font-semibold")}>
                        {mail.from}
                      </span>
                      <span className="text-xs text-muted-foreground">{mail.timestamp}</span>
                    </div>
                    <p className={cn("text-sm truncate", !mail.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {mail.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{mail.preview}</p>
                  </div>
                  <button
                    onClick={(e) => toggleStar(mail.id, e)}
                    className={cn(
                      "p-1 transition-colors",
                      mail.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                    )}
                  >
                    <Star className={cn("w-4 h-4", mail.isStarred && "fill-current")} />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Read Mail View */}
        {view === "read" && selectedMail && (
          <div className="nostalgia-card p-4">
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={selectedMail.from} size="md" />
              <div className="flex-1">
                <h2 className="font-semibold">{selectedMail.subject}</h2>
                <p className="text-sm text-muted-foreground">
                  Från: <span className="text-foreground">{selectedMail.from}</span>
                </p>
                <p className="text-xs text-muted-foreground">{selectedMail.timestamp}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm whitespace-pre-line">{selectedMail.content}</p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="msn">
                <Reply className="w-4 h-4 mr-2" />
                Svara
              </Button>
              <Button variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Radera
              </Button>
            </div>
          </div>
        )}

        {/* Compose View */}
        {view === "compose" && (
          <div className="nostalgia-card p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Skriv nytt mejl
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Till</label>
                <Input
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="Användarnamn..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Ämne</label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Skriv ämne..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Meddelande</label>
                <Textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  placeholder="Skriv ditt meddelande..."
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setView("inbox")}>
                  Avbryt
                </Button>
                <Button variant="msn" onClick={handleSend}>
                  <Send className="w-4 h-4 mr-2" />
                  Skicka
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
