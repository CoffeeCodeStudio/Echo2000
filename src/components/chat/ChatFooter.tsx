/** Footer bar with "clear all messages" and sound status */
import { Volume2, VolumeX, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "../ui/alert-dialog";

interface ChatFooterProps {
  soundEnabled: boolean;
  showClearButton: boolean;
  onClearAll: () => void;
}

export function ChatFooter({ soundEnabled, showClearButton, onClearAll }: ChatFooterProps) {
  return (
    <div className="bg-gradient-to-b from-[hsl(var(--muted))] to-[hsl(var(--border))] px-3 py-1 text-[10px] text-muted-foreground flex items-center justify-between border-t border-border">
      <span>Echo Messenger © 2025 - Nostalgi på riktigt!</span>
      <div className="flex items-center gap-3">
        {showClearButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-1 text-[#ff6600] hover:text-[#cc5200] transition-colors font-bold">
                <Trash2 className="w-3 h-3" />
                Töm alla
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Töm alla meddelanden
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Vill du verkligen radera ALLA dina privata meddelanden? Detta går inte att ångra.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ja, radera allt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <span className="flex items-center gap-1">
          {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {soundEnabled ? "Ljud på" : "Ljud av"}
        </span>
      </div>
    </div>
  );
}
