import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Skull, Sparkles, Play, Activity } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function AdminBotSpawner() {
  const [spawning, setSpawning] = useState(false);
  const [exorcising, setExorcising] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [result, setResult] = useState("");
  const [cronResult, setCronResult] = useState("");
  const [cronStatus, setCronStatus] = useState<{ active: boolean; lastRun: string | null; activeBots: number }>({ active: false, lastRun: null, activeBots: 0 });
  const { toast } = useToast();

  // Poll cron status every 15s
  useEffect(() => {
    const checkCronStatus = async () => {
      try {
        // Check latest bot lajv activity as a proxy for cron running
        const { data: recentLajv } = await supabase
          .from("lajv_messages")
          .select("created_at, username")
          .order("created_at", { ascending: false })
          .limit(1);

        const { data: recentGB } = await supabase
          .from("profile_guestbook")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1);

        // Check active bot count
        const { count } = await supabase
          .from("bot_settings")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        const latestActivity = [
          recentLajv?.[0]?.created_at,
          recentGB?.[0]?.created_at,
        ].filter(Boolean).sort().reverse()[0];

        const isActive = latestActivity
          ? (Date.now() - new Date(latestActivity).getTime()) < 5 * 60 * 1000 // activity within 5 min
          : false;

        setCronStatus({
          active: isActive,
          lastRun: latestActivity || null,
          activeBots: count || 0,
        });
      } catch {}
    };

    checkCronStatus();
    const interval = setInterval(checkCronStatus, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const runBotCron = async () => {
    setCronRunning(true);
    setCronResult("");

    try {
      const { data, error } = await supabase.functions.invoke("bot-cron");

      if (error) throw new Error(error.message || "Unknown error");

      // Format results into readable lines
      const lines: string[] = [];
      if (data?.results) {
        for (const [botName, actions] of Object.entries(data.results)) {
          const arr = actions as string[];
          for (const action of arr) {
            // Skip boring "Skipped" lines, show interesting ones
            if (!action.startsWith("Skipped") && !action.startsWith("No autonomous")) {
              lines.push(`🤖 ${botName}: ${action}`);
            }
          }
        }
      }

      if (lines.length === 0) {
        setCronResult("⏳ Inga bot-aktiviteter utlöstes denna gång (alla rullade under tröskeln). Testa igen!");
      } else {
        setCronResult(lines.join("\n"));
      }

      toast({ title: "Bot-Cron klar!", description: `${lines.length} aktiviteter utförda.` });
    } catch (e) {
      const msg = (e as Error).message;
      setCronResult(`❌ Fel: ${msg}`);
      toast({ title: "Fel", description: msg, variant: "destructive" });
    } finally {
      setCronRunning(false);
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
            cronStatus.active
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${cronStatus.active ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {cronStatus.active ? "Cron aktiv" : "Cron inaktiv"}
          </div>
          {cronStatus.activeBots > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {cronStatus.activeBots} bottar
            </span>
          )}
        </div>
      </div>

      {cronStatus.lastRun && (
        <p className="text-xs text-muted-foreground">
          ⏱ Senaste aktivitet: {formatTimeAgo(cronStatus.lastRun)} • Kör var 10:e sekund
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Spawna 35 unika bot-profiler med 2000-talsnamn. De dyker upp i medlemslistor, statistik och "senaste inloggade". Exorcism raderar ALLA bottar permanent.
      </p>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => callBotManager("spawn_bots")} disabled={spawning || exorcising || cronRunning}>
          {spawning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
          Spawna 35 Bottar
        </Button>

        <Button size="sm" variant="outline" onClick={() => callBotManager("update_presence")} disabled={spawning || exorcising || cronRunning}>
          <Sparkles className="w-3 h-3 mr-1" />Uppdatera Närvaro
        </Button>


        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={spawning || exorcising || cronRunning}>
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
      </div>

      {result && (
        <div className="bg-muted/50 border border-border rounded p-3 text-sm">
          <p>{result}</p>
        </div>
      )}

      {cronResult && (
        <div className="bg-muted/50 border border-border rounded p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
          <p className="font-bold text-xs mb-1">Bot-Cron Resultat:</p>
          <p>{cronResult}</p>
        </div>
      )}
    </div>
  );
}
