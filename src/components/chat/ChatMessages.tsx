/** Message list with date separators and nudge styling */
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
  date: Date;
}

interface ChatMessagesProps {
  messages: DisplayMessage[];
  loading: boolean;
  contactName: string;
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

export function ChatMessages({ messages, loading, contactName }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-3 font-mono text-sm scrollbar-nostalgic">
      {/* Conversation header */}
      <div className="text-center text-[11px] text-gray-600 dark:text-gray-400 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
        Du har startat en konversation med {contactName}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage ||
          formatDateLabel(message.date) !== formatDateLabel(prevMessage.date);

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-900 px-2">
                  {formatDateLabel(message.date)}
                </span>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
              </div>
            )}
            {message.content.includes("skickade en nudge!") ? (
              <div className="mb-2 animate-fade-in text-center">
                <span className="text-[11px] italic text-gray-500 dark:text-gray-400">
                  🔔 {message.senderName} skickade en nudge! ({message.timestamp})
                </span>
              </div>
            ) : (
              <div className="mb-2 animate-fade-in">
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "font-bold text-xs whitespace-nowrap",
                    message.isSelf ? "text-blue-600 dark:text-blue-400" : "text-[#d4388c] dark:text-pink-400"
                  )}>
                    {message.senderName} säger:
                  </span>
                  <span className="text-[10px] text-gray-500">({message.timestamp})</span>
                </div>
                <p className="ml-0 text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                  {convertMsnEmoticons(message.content)}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
