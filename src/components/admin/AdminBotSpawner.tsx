import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Skull, Sparkles } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function AdminBotSpawner() {
  const [spawning, setSpawning] = useState(false);
  const [exorcising, setExorcising] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();

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

  return (
    <div className="nostalgia-card p-4 space-y-4">
      <h3 className="font-display font-bold text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Bot Population Manager
      </h3>
      <p className="text-xs text-muted-foreground">
        Spawna 35 unika bot-profiler med 2000-talsnamn. De dyker upp i medlemslistor, statistik och "senaste inloggade". Exorcism raderar ALLA bottar permanent.
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
