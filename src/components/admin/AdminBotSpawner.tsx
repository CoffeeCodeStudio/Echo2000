import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Skull, Sparkles, Activity, Pause, Play, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
      </div>

      {result && (
        <div className="bg-muted/50 border border-border rounded p-3 text-sm">
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
