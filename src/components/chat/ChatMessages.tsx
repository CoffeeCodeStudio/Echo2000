/** Message list with date separators, nudge styling, and sender avatars */
import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { convertMsnEmoticons } from "./MsnEmoticons";

interface DisplayMessage {
  id: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  senderName: string;
  senderAvatar?: string;
  date: Date;
}

interface ChatMessagesProps {
  messages: DisplayMessage[];
  loading: boolean;
  contactName: string;
  contactTyping?: boolean;
}

/** Format date separator labels (Idag / Igår / full date) */
function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Idag";
  if (isSameDay(date, yesterday)) return "Igår";
  return date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}

export function ChatMessages({ messages, loading, contactName, contactTyping }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-card p-3 font-mono text-[11px] scrollbar-nostalgic">
      {/* Conversation header */}
      <div className="text-center text-[10px] text-muted-foreground mb-4 pb-2 border-b border-border">
        Du har startat en konversation med {contactName}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#ff6600]" />
        </div>
      )}

      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage ||
          formatDateLabel(message.date) !== formatDateLabel(prevMessage.date);

        // Determine if this is a new message block (different sender or date separator)
        const isNewBlock = !prevMessage ||
          showDateSeparator ||
          prevMessage.isSelf !== message.isSelf ||
          prevMessage.senderName !== message.senderName;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-card px-2">
                  {formatDateLabel(message.date)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {message.content.includes("skickade en nudge!") ? (
              <div className="mb-2 animate-fade-in text-center">
                <span className="text-[10px] italic text-[#ff6600]">
                  🔔 {message.senderName} skickade en nudge! ({message.timestamp})
                </span>
              </div>
            ) : (
              <div className={cn(
                "mb-0.5 animate-fade-in border-b border-border/50",
                index % 2 === 0 ? "bg-card" : "bg-muted/30"
              )}>
                <div className="flex items-start gap-2 px-1 py-0.5">
                  {/* Sender avatar - only show at start of new block */}
                  {isNewBlock ? (
                    <div className="w-8 h-8 overflow-hidden flex-shrink-0 border border-border bg-muted">
                      {message.senderAvatar ? (
                        <img src={message.senderAvatar} alt={message.senderName} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {message.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 flex-shrink-0" /> /* spacer for alignment */
                  )}
                  <div className="flex-1 min-w-0">
                    {isNewBlock && (
                      <div className="flex items-baseline gap-2">
                        <span className={cn(
                          "font-bold text-[11px] whitespace-nowrap",
                          message.isSelf ? "text-[#ff6600]" : "text-[#d4388c]"
                        )}>
                          {message.senderName} säger:
                        </span>
                        <span className="text-[9px] text-muted-foreground">({message.timestamp})</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed text-[11px]">
                        {convertMsnEmoticons(message.content)}
                      </p>
                      {!isNewBlock && (
                        <span className="text-[8px] text-muted-foreground flex-shrink-0">({message.timestamp})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {contactTyping && (
        <div className="mb-2 animate-fade-in flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
              {contactName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] italic text-gray-500 dark:text-gray-400">
              {contactName} skriver
            </span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
