import { useState } from 'react';
import { Loader2, Trash2, Send } from 'lucide-react';
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
  const { entries, loading, posting, postEntry, deleteEntry } =
    useProfileGuestbook(profileOwnerId);
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    const success = await postEntry(newMessage);
    if (success) {
      setNewMessage('');
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
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <Textarea
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
                    <ClickableUsername
                      username={entry.author_name}
                      nameClassName="text-sm font-semibold"
                    />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {replaceEmoteCodes(entry.message)}
                  </p>
                </div>
                {/* Delete button for author or profile owner */}
                {user &&
                  (entry.author_id === user.id ||
                    (isOwnProfile && profileOwnerId === user.id)) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
