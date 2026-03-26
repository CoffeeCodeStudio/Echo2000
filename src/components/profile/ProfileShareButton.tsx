/**
 * @module ProfileShareButton
 * Captures the profile card as a styled retro image for social sharing.
 */
import { useState, useCallback } from "react";
import { Camera, Download, Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface ProfileShareButtonProps {
  /** Ref-callback id of the profile card wrapper to capture */
  targetId: string;
  username: string;
}

export function ProfileShareButton({ targetId, username }: ProfileShareButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const captureCard = useCallback(async (): Promise<Blob | null> => {
    const el = document.getElementById(targetId);
    if (!el) {
      toast.error("Kunde inte hitta profilkortet");
      return null;
    }

    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    // Draw retro overlay branding
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const w = canvas.width;
      const h = canvas.height;

      // Bottom banner
      const bannerH = 56;
      ctx.fillStyle = "rgba(22, 48, 64, 0.92)";
      ctx.fillRect(0, h - bannerH, w, bannerH);

      // Divider line
      ctx.strokeStyle = "#5A94AB";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h - bannerH);
      ctx.lineTo(w, h - bannerH);
      ctx.stroke();

      // Brand text
      ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "#d8613e";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Echo2000", 20, h - bannerH / 2);

      ctx.font = "14px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "#8bb8c8";
      ctx.textAlign = "right";
      ctx.fillText("echo2000.lovable.app", w - 20, h - bannerH / 2);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }, [targetId]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await captureCard();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `echo2000-${username}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Profilbild nedladdad!");
    } catch {
      toast.error("Något gick fel vid genereringen");
    } finally {
      setGenerating(false);
    }
  }, [captureCard, username]);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await captureCard();
      if (!blob) return;

      const file = new File([blob], `echo2000-${username}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${username} på Echo2000`,
          text: `Kolla in ${username}s profil på Echo2000! 💾`,
          files: [file],
        });
      } else {
        // Fallback: copy profile URL
        await navigator.clipboard.writeText(
          `${window.location.origin}/profil/${username}`
        );
        setCopied(true);
        toast.success("Profillänk kopierad!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Kunde inte dela");
      }
    } finally {
      setGenerating(false);
    }
  }, [captureCard, username]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/profil/${username}`
      );
      setCopied(true);
      toast.success("Profillänk kopierad!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  }, [username]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={generating} className="gap-1.5">
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          Dela
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Ladda ner som bild
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Dela profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
          Kopiera profillänk
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
