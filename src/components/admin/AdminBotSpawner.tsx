import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Skull, Sparkles, Activity, Pause, Play, Trash2, ChevronDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CLEAR_CATEGORIES = [
  { key: "all", label: "🧹 Rensa ALLT", description: "Alla bot-meddelanden, inlägg och minnen" },
  { key: "chat", label: "💬 Chatt", description: "Echo Messenger-meddelanden" },
  { key: "lajv", label: "🎭 Lajv", description: "Lajv-inlägg" },
  { key: "profile_guestbook", label: "📖 Profilgästbok", description: "Gästboksinlägg på profiler" },
  { key: "guestbook", label: "📕 Gästbok (gammal)", description: "Gamla gästboksinlägg" },
  { key: "emails", label: "📧 Mejl", description: "Mejl skickade av bottar" },
  { key: "news_comments", label: "📰 Nyhetskommentarer", description: "Kommentarer på nyheter" },
  { key: "trigger_log", label: "📋 Trigger-loggar", description: "Alla trigger-loggar" },
  { key: "memories", label: "🧠 Minnen", description: "Bot-minnen om användare" },
  { key: "klotter", label: "🎨 Klotter", description: "Klotterplanket-teckningar av bottar" },
  { key: "friends", label: "🤝 Vänner", description: "Vänskapsrelationer med bottar" },
  { key: "profile_visits", label: "👁️ Profilbesök", description: "Profilbesök gjorda av bottar" },
] as const;

interface CronInfo {
  active: boolean;
  schedule: string;
  lastRun: string | null;
  lastStatus: string | null;
  activeBots: number;
}

export function AdminBotSpawner() {
  const [spawning, setSpawning] = useState(false);
  const [exorcising, setExorcising] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [togglingCron, setTogglingCron] = useState(false);
  const [result, setResult] = useState("");
  const [cronInfo, setCronInfo] = useState<CronInfo>({ active: false, schedule: "", lastRun: null, lastStatus: null, activeBots: 0 });
  const { toast } = useToast();

  const fetchCronStatus = useCallback(async () => {
    try {
      // Use RPC to get real cron job status
      const { data, error } = await supabase.rpc("manage_bot_cron" as any, { p_action: "status" });

      const result = (error ? null : data) as { success: boolean; active: boolean; schedule: string; last_run: string | null; last_status: string | null } | null;

      // Get active bot count
      const { count } = await supabase
        .from("bot_settings")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      setCronInfo({
        active: result?.active ?? false,
        schedule: result?.schedule ?? "unknown",
        lastRun: result?.last_run ?? null,
        lastStatus: result?.last_status ?? null,
        activeBots: count || 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchCronStatus();
    const interval = setInterval(fetchCronStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchCronStatus]);

  const toggleCron = async () => {
    setTogglingCron(true);
    const action = cronInfo.active ? "pause" : "resume";
    try {
      const { data, error } = await supabase.rpc("manage_bot_cron" as any, { p_action: action });
      if (error) throw new Error(error.message);
      toast({ title: action === "pause" ? "Cron pausad" : "Cron återstartad" });
      await fetchCronStatus();
    } catch (e) {
      toast({ title: "Fel", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTogglingCron(false);
    }
  };

  const callBotManager = async (action: string) => {
    const isSpawn = action === "spawn_bots";
    if (isSpawn) setSpawning(true);
    else setExorcising(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("bot-manager", {
        body: { action },
      });

      if (error) throw new Error(error.message || "Unknown error");

      if (isSpawn) {
        setResult(`✅ Skapade ${data.created} bottar, ${data.skipped} redan existerande`);
        toast({ title: "Bottar skapade!", description: `${data.created} nya bot-profiler.` });
      } else if (action === "exorcism") {
        setResult(`💀 ${data.deleted} bottar raderade permanent`);
        toast({ title: "Exorcism klar!", description: `${data.deleted} bot-profiler raderade.` });
      } else {
        setResult(`✅ ${data.updated}/${data.total} bottars närvaro uppdaterad`);
        toast({ title: "Närvaro uppdaterad" });
      }
    } catch (e) {
      const msg = (e as Error).message;
      setResult(`❌ Fel: ${msg}`);
      toast({ title: "Fel", description: msg, variant: "destructive" });
    } finally {
      setSpawning(false);
      setExorcising(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s sedan`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m sedan`;
    return `${Math.floor(diff / 3600)}h sedan`;
  };

  return (
    <div className="nostalgia-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Bot Population Manager
        </h3>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            cronInfo.active
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${cronInfo.active ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {cronInfo.active ? "Cron aktiv" : "Cron pausad"}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={toggleCron}
            disabled={togglingCron}
          >
            {togglingCron ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : cronInfo.active ? (
              <><Pause className="w-3 h-3 mr-1" /> Pausa</>
            ) : (
              <><Play className="w-3 h-3 mr-1" /> Starta</>
            )}
          </Button>
          {cronInfo.activeBots > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {cronInfo.activeBots} bottar
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {cronInfo.lastRun && (
          <span>⏱ Senaste körning: {formatTimeAgo(cronInfo.lastRun)}</span>
        )}
        {cronInfo.lastStatus && (
          <span className={cronInfo.lastStatus === "succeeded" ? "text-green-400" : "text-red-400"}>
            • {cronInfo.lastStatus}
          </span>
        )}
        {cronInfo.schedule && cronInfo.active && (
          <span>• Schema: {cronInfo.schedule}</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Spawna 35 unika bot-profiler med 2000-talsnamn. Exorcism raderar ALLA bottar permanent.
      </p>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => callBotManager("spawn_bots")} disabled={spawning || exorcising}>
          {spawning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
          Spawna 35 Bottar
        </Button>

        <Button size="sm" variant="outline" onClick={() => callBotManager("update_presence")} disabled={spawning || exorcising}>
          <Sparkles className="w-3 h-3 mr-1" />Uppdatera Närvaro
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={spawning || exorcising}>
              {exorcising ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Skull className="w-3 h-3 mr-1" />}
              💀 Exorcism
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Exorcism — Radera ALLA bottar?</AlertDialogTitle>
              <AlertDialogDescription>
                Detta raderar permanent ALLA bot-profiler, deras meddelanden, gästboksinlägg, vänner och auth-konton. Kan inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={() => callBotManager("exorcism")} className="bg-destructive text-destructive-foreground">
                Ja, radera alla bottar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ClearCategoryMenu
          clearing={clearing}
          disabled={spawning || exorcising}
          onClear={async (category) => {
            setClearing(true);
            try {
              const { data, error } = await supabase.rpc("clear_all_bot_activity" as any, { p_category: category });
              if (error) throw new Error(error.message);
              const res = data as any;
              if (res?.success) {
                const d = res.deleted;
                const parts = Object.entries(d)
                  .filter(([, v]) => (v as number) > 0)
                  .map(([k, v]) => `${k}: ${v}`);
                const msg = parts.length > 0 ? parts.join(", ") : "Inget att rensa";
                setResult(`🧹 ${category === "all" ? "All aktivitet" : CLEAR_CATEGORIES.find(c => c.key === category)?.label || category} rensad — ${msg}`);
                toast({ title: "Bot-aktivitet rensad", description: msg });
              } else {
                throw new Error(res?.error || "Okänt fel");
              }
            } catch (e) {
              toast({ title: "Fel", description: (e as Error).message, variant: "destructive" });
            } finally {
              setClearing(false);
            }
          }}
        />
      </div>

      {result && (
        <div className="bg-muted/50 border border-border rounded p-3 text-sm">
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

function ClearCategoryMenu({ clearing, disabled, onClear }: { clearing: boolean; disabled: boolean; onClear: (category: string) => void }) {
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="destructive" disabled={disabled || clearing}>
            {clearing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
            🧹 Rensa aktivitet
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 max-h-[70vh] overflow-y-auto">
          {CLEAR_CATEGORIES.map((cat) => (
            <DropdownMenuItem key={cat.key} onClick={() => setPendingCategory(cat.key)} className="flex flex-col items-start gap-0.5">
              <span className="font-medium text-sm">{cat.label}</span>
              <span className="text-xs text-muted-foreground">{cat.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!pendingCategory} onOpenChange={(open) => { if (!open) setPendingCategory(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Radera bot-aktivitet?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCategory === "all"
                ? "Detta raderar ALLA bot-meddelanden, inlägg, loggar och minnen. Kan inte ångras."
                : `Detta raderar ${CLEAR_CATEGORIES.find(c => c.key === pendingCategory)?.description?.toLowerCase() || "vald kategori"}. Kan inte ångras.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (pendingCategory) onClear(pendingCategory);
                setPendingCategory(null);
              }}
            >
              Ja, rensa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
