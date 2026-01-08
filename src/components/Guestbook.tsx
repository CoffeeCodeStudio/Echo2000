import { useState } from "react";
import { Send, Heart, MessageCircle, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

interface GuestbookEntry {
  id: string;
  author: string;
  authorAvatar?: string;
  message: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

const initialEntries: GuestbookEntry[] = [
  {
    id: "1",
    author: "Emma",
    message: "Vilken cool profil du har! Minns du när vi chattade på LunarStorm på riktigt? 🌙✨",
    timestamp: "idag kl 14:32",
    likes: 3,
    isLiked: false,
  },
  {
    id: "2",
    author: "Johan",
    message: "Hej kompansen! Länge sedan, hoppas allt är bra med dig. Nostalgitripp att vara här igen!",
    timestamp: "igår kl 21:15",
    likes: 7,
    isLiked: true,
  },
  {
    id: "3",
    author: "Lisa",
    message: "💕 Kramis! Saknar de gamla goda tiderna. Vi måste ses snart IRL!",
    timestamp: "2 dagar sedan",
    likes: 12,
    isLiked: false,
  },
  {
    id: "4",
    author: "Marcus",
    message: "Såg din nya bild, snygging! 😎 Hoppas du har det bra. Skriv i min gästbok också!",
    timestamp: "3 dagar sedan",
    likes: 5,
    isLiked: false,
  },
];

export function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = () => {
    if (!newMessage.trim()) return;

    const newEntry: GuestbookEntry = {
      id: Date.now().toString(),
      author: "Du",
      message: newMessage,
      timestamp: "just nu",
      likes: 0,
      isLiked: false,
    };

    setEntries([newEntry, ...entries]);
    setNewMessage("");
  };

  const toggleLike = (id: string) => {
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { 
            ...entry, 
            isLiked: !entry.isLiked, 
            likes: entry.isLiked ? entry.likes - 1 : entry.likes + 1 
          }
        : entry
    ));
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
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv ditt meddelande här..."
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button variant="msn" onClick={handleSubmit} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Skicka
            </Button>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="nostalgia-card p-4">
              <div className="flex gap-3">
                <Avatar name={entry.author} size="md" status="online" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{entry.author}</span>
                    <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1 text-foreground/90">{entry.message}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => toggleLike(entry.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        entry.isLiked ? "text-accent" : "text-muted-foreground hover:text-accent"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", entry.isLiked && "fill-current")} />
                      {entry.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      Svara
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
