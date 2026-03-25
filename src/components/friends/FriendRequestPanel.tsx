import { useState } from "react";
import { Loader2, UserPlus, UserMinus, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePendingFriendRequests, type PendingRequest } from "@/hooks/usePendingFriendRequests";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FRIEND_CATEGORIES } from "./FriendCard";

const HOW_MET_OPTIONS = [
  { value: "Online", emoji: "🌐" },
  { value: "IRL", emoji: "🤝" },
  { value: "Skolan", emoji: "🎒" },
  { value: "Jobbet", emoji: "💼" },
  { value: "Via vänner", emoji: "👥" },
  { value: "Annat", emoji: "✨" },
] as const;

interface FriendRequestPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendRequestPanel({ open, onOpenChange }: FriendRequestPanelProps) {
  const { requests, loading, acceptRequest, declineRequest } = usePendingFriendRequests();
  const { toast } = useToast();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptStep, setAcceptStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("Nätvän");
  const [selectedHowMet, setSelectedHowMet] = useState<string>("Online");
  const [currentRequest, setCurrentRequest] = useState<PendingRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const startAccept = (request: PendingRequest) => {
    setCurrentRequest(request);
    setAcceptingId(request.id);
    setAcceptStep(1);
    setSelectedCategory("Nätvän");
    setSelectedHowMet("Online");
  };

  const handleSkip = async () => {
    if (!currentRequest) return;
    setActionLoading(currentRequest.id);
    const success = await acceptRequest(currentRequest.id, null, null);
    setActionLoading(null);
    if (success) {
      setAcceptStep(3);
      toast({ title: "Ny vän! 🎉", description: `Du och ${currentRequest.senderProfile.username} är nu vänner!` });
    } else {
      toast({ title: "Något gick fel", description: "Försök igen.", variant: "destructive" });
    }
  };

  const handleNextStep = async () => {
    if (acceptStep === 1) {
      setAcceptStep(2);
    } else if (acceptStep === 2) {
      if (!currentRequest) return;
      setActionLoading(currentRequest.id);
      const success = await acceptRequest(currentRequest.id, selectedCategory, selectedHowMet);
      setActionLoading(null);
      if (success) {
        setAcceptStep(3);
        toast({ title: "Ny vän! 🎉", description: `Du och ${currentRequest.senderProfile.username} är nu vänner!` });
      } else {
        toast({ title: "Något gick fel", description: "Försök igen.", variant: "destructive" });
      }
    } else {
      // Step 3 done
      setAcceptingId(null);
      setCurrentRequest(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    const success = await declineRequest(id);
    setActionLoading(null);
    if (success) {
      toast({ title: "Förfrågan avvisad", description: "Vänförfrågan togs bort." });
    }
  };

  const handleBack = () => {
    if (acceptStep === 2) setAcceptStep(1);
    else if (acceptStep === 1) {
      setAcceptingId(null);
      setCurrentRequest(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="lunar-box-header px-4 py-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <DialogTitle className="text-sm font-bold uppercase text-white">
            Vänförfrågningar
          </DialogTitle>
          {requests.length > 0 && (
            <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">
              {requests.length}
            </span>
          )}
        </div>

        <div className="p-3 max-h-[70vh] overflow-y-auto">
          {/* Accept flow modal */}
          {acceptingId && currentRequest ? (
            <AcceptFlow
              request={currentRequest}
              step={acceptStep}
              selectedCategory={selectedCategory}
              selectedHowMet={selectedHowMet}
              onSelectCategory={setSelectedCategory}
              onSelectHowMet={setSelectedHowMet}
              onNext={handleNextStep}
              onBack={handleBack}
              onSkip={handleSkip}
              loading={actionLoading === currentRequest.id}
            />
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Inga vänförfrågningar just nu</p>
            </div>
          ) : (
            <div className="space-y-1">
              {requests.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  onAccept={() => startAccept(req)}
                  onDecline={() => handleDecline(req.id)}
                  loading={actionLoading === req.id}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══ REQUEST ROW ═══ */

function RequestRow({
  request,
  onAccept,
  onDecline,
  loading,
}: {
  request: PendingRequest;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  const { senderProfile, mutualFriendsCount, created_at } = request;

  return (
    <div className="flex items-center gap-2 p-2 border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
      <img
        src={senderProfile.avatar_url || "/placeholder.svg"}
        alt={senderProfile.username}
        className="w-10 h-10 border border-border object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{senderProfile.username}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {mutualFriendsCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {mutualFriendsCount} gemensamma
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(created_at)}
          </span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={loading}
          className="h-7 px-2 text-[10px] font-bold lunar-box-header border-0"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Acceptera"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDecline}
          disabled={loading}
          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive"
        >
          <UserMinus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/* ═══ ACCEPT FLOW (3 steps) ═══ */

function AcceptFlow({
  request,
  step,
  selectedCategory,
  selectedHowMet,
  onSelectCategory,
  onSelectHowMet,
  onNext,
  onBack,
  loading,
}: {
  request: PendingRequest;
  step: 1 | 2 | 3;
  selectedCategory: string;
  selectedHowMet: string;
  onSelectCategory: (c: string) => void;
  onSelectHowMet: (h: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const { senderProfile } = request;

  return (
    <div className="space-y-3">
      {/* Avatar + name header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <img
          src={senderProfile.avatar_url || "/placeholder.svg"}
          alt={senderProfile.username}
          className="w-10 h-10 border-2 border-primary object-cover"
        />
        <div>
          <p className="text-xs font-bold text-foreground">{senderProfile.username}</p>
          <p className="text-[10px] text-muted-foreground">
            Steg {step} av 3
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">
            Hur känner du {senderProfile.username}?
          </p>
          <div className="grid grid-cols-2 gap-1">
            {FRIEND_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={cn(
                  "text-[11px] py-1.5 px-2 border text-left transition-colors",
                  selectedCategory === cat
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 text-foreground hover:bg-muted/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">
            Hur träffades ni?
          </p>
          <div className="grid grid-cols-2 gap-1">
            {HOW_MET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSelectHowMet(opt.value)}
                className={cn(
                  "text-[11px] py-1.5 px-2 border text-left transition-colors flex items-center gap-1.5",
                  selectedHowMet === opt.value
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 text-foreground hover:bg-muted/40"
                )}
              >
                <span>{opt.emoji}</span>
                {opt.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-4 space-y-2">
          <div className="text-3xl">🎉</div>
          <p className="text-sm font-bold text-foreground">
            Du och {senderProfile.username} är nu vänner!
          </p>
          <p className="text-[10px] text-muted-foreground">
            Kategori: {selectedCategory} · Träffades: {selectedHowMet}
          </p>
          <p className="text-[10px] text-muted-foreground">
            BotAdam har skrivit i era gästböcker! 📝
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between pt-1">
        {step < 3 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-[10px] h-7"
            >
              Tillbaka
            </Button>
            <Button
              size="sm"
              onClick={onNext}
              disabled={loading}
              className="text-[10px] h-7 lunar-box-header border-0"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : step === 2 ? (
                "Acceptera ✓"
              ) : (
                "Nästa →"
              )}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={onNext}
            className="w-full text-[10px] h-7 lunar-box-header border-0"
          >
            Klar!
          </Button>
        )}
      </div>
    </div>
  );
}
