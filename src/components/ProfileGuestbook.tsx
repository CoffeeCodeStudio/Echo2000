import { useState, useRef, useCallback } from 'react';
import { Loader2, Trash2, Send, MessageSquare, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ClickableUsername } from './ClickableUsername';
import { useProfileGuestbook } from '@/hooks/useProfileGuestbook';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { replaceEmoteCodes } from './social/PixelEmotes';
import { ReportButton } from './social/ReportButton';
import { sanitizeAvatarUrl } from '@/lib/avatar-url';
import { useToast } from '@/hooks/use-toast';
import { useLiveAvatars } from '@/hooks/useLiveAvatars';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface ProfileGuestbookProps {
  profileOwnerId: string;
  isOwnProfile: boolean;
  className?: string;
}

export function ProfileGuestbook({
  profileOwnerId,
  isOwnProfile,
  className,
}: ProfileGuestbookProps) {
  const { user } = useAuth();
  const { entries, loading, posting, postEntry, postEntryTo, deleteEntry, clearAll } =
    useProfileGuestbook(profileOwnerId);
  const [newMessage, setNewMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ name: string; id: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAvatar } = useLiveAvatars(entries.map(e => e.author_id));

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    if (replyTarget && replyTarget.id !== profileOwnerId) {
      // Reply goes to the author's guestbook, not the current one
      const success = await postEntryTo(replyTarget.id, newMessage);
      if (success) {
        setNewMessage('');
        setReplyTarget(null);
      }
    } else {
      const success = await postEntry(newMessage);
      if (success) {
        setNewMessage('');
        setReplyTarget(null);
      }
    }
  };

  const handleReply = useCallback((authorName: string, authorId: string) => {
    // Clean reply - no @ or # prefixes, clear textarea completely
    setNewMessage('');
    setReplyTarget({ name: authorName, id: authorId });
    // Scroll to form and focus textarea
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleClearAll = async () => {
    if (!user) return;
    setClearing(true);
    const success = await clearAll();
    if (success) {
      toast({ title: 'Gästboken rensad!' });
    } else {
      toast({
        title: 'Kunde inte rensa gästboken',
        description: 'Försök igen senare',
        variant: 'destructive',
      });
    }
    setClearing(false);
  };

  if (loading) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">
          Laddar gästbok...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Post form */}
      {user && (
        <div ref={formRef} className="bg-card border border-border mb-0">
          <div className="lunar-box-header px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Send className="w-3 h-3" />
            {replyTarget ? `Svara ${replyTarget.name}` : 'Skriv i gästboken'}
            {replyTarget && (
              <button onClick={() => { setReplyTarget(null); setNewMessage(''); }} className="ml-auto text-white/70 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="p-2.5">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyTarget ? `Svara ${replyTarget.name}...` : isOwnProfile ? "Skriv ett svar i din gästbok..." : "Skriv något trevligt i gästboken..."}
              className="mb-2 resize-none text-[11px] border-border"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{newMessage.length}/500</span>
              <button
                onClick={handleSubmit}
                disabled={posting || !newMessage.trim()}
                className="px-3 py-1 text-[11px] font-bold text-white bg-[#ff6600] border border-[#cc5500] hover:bg-[#e55c00] disabled:opacity-50 flex items-center gap-1"
              >
                {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Skicka
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all button for profile owner */}
      {isOwnProfile && user && entries.length > 0 && (
        <div className="flex justify-end py-1 px-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1" disabled={clearing}>
                {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Rensa gästbok
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rensa gästboken?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alla inlägg i din gästbok kommer att raderas permanent. Detta går inte att ångra.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>Ja, rensa allt</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="bg-card border border-border p-6 text-center">
          <p className="text-[12px] font-bold text-muted-foreground mb-1">📝 Här var det tomt!</p>
          <p className="text-[11px] text-muted-foreground">
            {isOwnProfile ? 'Skriv något vetja.' : 'Var först att skriva något vetja!'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5 border-b border-border last:border-b-0",
                i % 2 === 0 ? "bg-card" : "bg-muted/40"
              )}
            >
              <div className="shrink-0">
                <ClickableUsername
                  username={entry.author_name}
                  avatarUrl={getAvatar(entry.author_id, entry.author_avatar)}
                  showAvatar
                  avatarSize="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: sv })}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {user && (
                      <button
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => handleReply(entry.author_name, entry.author_id)}
                        title="Svara"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    )}
                    {user && entry.author_id !== user.id && (
                      <ReportButton contentType="gästboksinlägg" contentId={entry.id} contentAuthor={entry.author_name} contentPreview={entry.message} variant="icon" />
                    )}
                    {user && ((isOwnProfile && profileOwnerId === user.id) || entry.author_id === user.id) && (
                      <button
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => deleteEntry(entry.id)}
                        title="Radera"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed">
                  {replaceEmoteCodes(entry.message)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
