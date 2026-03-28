/** KlotterGallery - Gallery view for published klotter drawings with lightbox */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";
import { formatTimeAgo } from "@/lib/format";
import { Dialog, DialogContent } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { ClickableUsername } from "../ClickableUsername";
import { GoodVibe } from "./GoodVibe";
import { ReportButton } from "./ReportButton";

interface KlotterItem {
  id: string;
  user_id?: string;
  author_name: string;
  comment: string | null;
  created_at: string;
  image_url: string;
  signed_url?: string;
}

interface KlotterGalleryProps {
  klotter: KlotterItem[];
  loading: boolean;
  isMobile: boolean;
  onSwitchToDraw: () => void;
  currentUserId?: string;
  onDelete?: (id: string) => Promise<boolean>;
}

export function KlotterGallery({ klotter, loading, isMobile, onSwitchToDraw, currentUserId, onDelete }: KlotterGalleryProps) {
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (klotter.length === 0) {
    return (
      <div className={`text-center ${isMobile ? "py-8" : "py-12"} text-muted-foreground`}>
        <p className={isMobile ? "text-sm" : ""}>{loading ? (isMobile ? "Laddar..." : "Laddar klotter...") : (isMobile ? "Inga klotter än!" : "Inga klotter publicerade än!")}</p>
        {!loading && (
          <Button onClick={onSwitchToDraw} variant="link" className="text-primary">
            Bli först att rita{isMobile ? "" : " något"}
          </Button>
        )}
      </div>
    );
  }

  const currentItem = lightboxIndex !== null ? klotter[lightboxIndex] : null;
  const isOwnItem = currentItem && currentUserId && currentItem.user_id === currentUserId;

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  };
  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < klotter.length - 1) setLightboxIndex(lightboxIndex + 1);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId || !onDelete) return;
    const success = await onDelete(pendingDeleteId);
    if (success) {
      setLightboxIndex(null);
    }
    setPendingDeleteId(null);
  };

  return (
    <>
      <div className={isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"}>
        {klotter.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(index)}
            className={`bg-card rounded-lg overflow-hidden border border-border text-left transition-colors ${isMobile ? "" : "hover:border-primary/50"} group relative`}
          >
            <div className="aspect-video bg-muted relative">
              {(item.signed_url || item.image_url) ? (
                <img src={item.signed_url || item.image_url} alt="Klotter" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={isMobile ? "text-2xl" : "text-4xl"}>🎨</span>
                </div>
              )}
              {/* Profile overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 flex items-center gap-1.5">
                <Avatar name={item.author_name} size="sm" />
                <span className="text-white text-xs font-medium truncate drop-shadow-sm">{item.author_name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 gap-0 bg-black/95 border-border overflow-hidden [&>button]:hidden">
          {currentItem && (
            <div className="flex flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => { setLightboxIndex(null); navigate(`/profile/${currentItem.author_name}`); }}>
                  <Avatar name={currentItem.author_name} size="sm" />
                  <div className="min-w-0">
                    <ClickableUsername username={currentItem.author_name} className="text-white text-sm font-medium truncate" />
                    <p className="text-white/50 text-xs">{formatTimeAgo(currentItem.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOwnItem && onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                      onClick={() => setPendingDeleteId(currentItem.id)}
                      title="Radera klotter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8" onClick={() => setLightboxIndex(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className="relative flex items-center justify-center min-h-[40vh] max-h-[70vh]">
                <img
                  src={currentItem.signed_url || currentItem.image_url}
                  alt="Klotter"
                  className="max-w-full max-h-[70vh] object-contain"
                />

                {/* Prev */}
                {lightboxIndex !== null && lightboxIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-10 w-10"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}

                {/* Next */}
                {lightboxIndex !== null && lightboxIndex < klotter.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-10 w-10"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}
              </div>

              {/* Comment & Good Vibe */}
              <div className="px-4 py-3 border-t border-white/10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {currentItem.comment && (
                    <p className="text-white/80 text-sm flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/50" />
                      {currentItem.comment}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <GoodVibe targetType="klotter" targetId={currentItem.id} />
                  {currentUserId && currentItem.user_id !== currentUserId && (
                    <ReportButton
                      contentType="klotter"
                      contentId={currentItem.id}
                      contentAuthor={currentItem.author_name}
                      contentPreview={currentItem.comment ?? undefined}
                      className="flex items-center gap-1 text-xs text-white/50 hover:text-red-400 transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Counter */}
              <div className="px-4 py-2 text-center text-white/40 text-xs border-t border-white/10">
                {(lightboxIndex ?? 0) + 1} / {klotter.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera klotter?</AlertDialogTitle>
            <AlertDialogDescription>
              Vill du verkligen radera detta klotter? Det går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Radera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
