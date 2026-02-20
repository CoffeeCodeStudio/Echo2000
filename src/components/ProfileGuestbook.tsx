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
import { replaceEmoteCodes } from './PixelEmotes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { entries, loading, posting, postEntry, deleteEntry, refetch } =
    useProfileGuestbook(profileOwnerId);
  const [newMessage, setNewMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    const success = await postEntry(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleReply = useCallback((authorName: string) => {
    setNewMessage((prev) => {
      const mention = `@${authorName} `;
      if (prev.includes(mention)) return prev;
      return mention + prev;
    });
    // Scroll to form and focus textarea
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleClearAll = async () => {
    if (!user) return;
    setClearing(true);
    try {
      const { error } = await supabase
        .from('profile_guestbook')
        .delete()
        .eq('profile_owner_id', profileOwnerId);

      if (error) {
        console.error('Error clearing guestbook:', error);
        toast({
          title: 'Kunde inte rensa gästboken',
          description: 'Försök igen senare',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Gästboken rensad!' });
        refetch();
      }
    } catch (err) {
      console.error('Error in handleClearAll:', err);
    } finally {
      setClearing(false);
    }
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
    <div className={cn('space-y-4', className)}>
      {/* Post form (only if logged in and viewing someone else's profile) */}
      {user && !isOwnProfile && (
        <div ref={formRef} className="bg-muted/30 rounded-lg p-4 border border-border">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv något trevligt i gästboken..."
            className="mb-2 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newMessage.length}/500
            </span>
            <Button
              variant="msn"
              size="sm"
              onClick={handleSubmit}
              disabled={posting || !newMessage.trim()}
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Skicka
            </Button>
          </div>
        </div>
      )}

      {/* Clear all button for profile owner */}
      {isOwnProfile && user && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                disabled={clearing}
              >
                {clearing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Rensa min gästbok
              </Button>
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
                <AlertDialogAction onClick={handleClearAll}>
                  Ja, rensa allt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-lg font-semibold text-muted-foreground mb-1">
            📝 Gästboken är tom
          </p>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? 'Inga har skrivit i din gästbok ännu'
              : 'Var först att skriva!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-card rounded-lg border border-border p-3"
            >
              <div className="flex items-start gap-3">
                <ClickableUsername
                  username={entry.author_name}
                  avatarUrl={entry.author_avatar}
                  showAvatar
                  avatarSize="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      {/* Delete button for author or profile owner */}
                      {user &&
                        (entry.author_id === user.id ||
                          (isOwnProfile && profileOwnerId === user.id)) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                            title="Radera"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {replaceEmoteCodes(entry.message)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
