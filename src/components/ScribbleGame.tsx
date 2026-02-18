import { useState, useRef, useEffect, useCallback } from "react";
import { useScribbleGame } from "@/hooks/useScribble";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Eraser, Paintbrush, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface DrawAction {
  points: DrawPoint[];
}

interface ScribbleGameProps {
  lobbyId: string;
  onLeave: () => void;
}

const COLORS = ["#000000", "#ff0000", "#0066ff", "#00cc44", "#ff9900", "#9933ff", "#ff69b4", "#ffffff"];
const BRUSH_SIZES = [3, 6, 10, 16];

const WORD_LIST = [
  "hund", "katt", "sol", "hus", "bil", "träd", "blomma", "fisk",
  "bok", "stol", "bord", "telefon", "glass", "pizza", "gitarr",
  "kanin", "elefant", "cykel", "banan", "jordgubbe", "paraply",
  "robot", "raket", "fjäril", "snögubbe", "drake", "krona",
  "hjärta", "stjärna", "måne", "berg", "sjö", "båt", "flygplan",
];

export function ScribbleGame({ lobbyId, onLeave }: ScribbleGameProps) {
  const { lobby, players, guesses, joinLobby, submitGuess, leaveLobby } = useScribbleGame(lobbyId);
  const { user } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [guessText, setGuessText] = useState("");
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawPoint[]>([]);
  const guessEndRef = useRef<HTMLDivElement>(null);

  const isDrawer = lobby?.current_drawer_id === user?.id;
  const isCreator = lobby?.creator_id === user?.id;

  // Join lobby on mount
  useEffect(() => {
    joinLobby();
  }, [lobbyId]); // eslint-disable-line

  // Scroll guesses to bottom
  useEffect(() => {
    guessEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses]);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  // Broadcast drawing via Supabase Realtime
  const broadcastChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!lobbyId) return;
    const channel = supabase.channel(`scribble-draw-${lobbyId}`);
    
    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      if (payload.drawer_id === user?.id) return;
      drawStroke(payload.points);
    }).on('broadcast', { event: 'clear' }, () => {
      clearCanvas();
    }).subscribe();

    broadcastChannel.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [lobbyId, user?.id]); // eslint-disable-line

  const drawStroke = useCallback((points: DrawPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 1; i < points.length; i++) {
      ctx.beginPath();
      ctx.strokeStyle = points[i].color;
      ctx.lineWidth = points[i].size;
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getPos(e);
    const point: DrawPoint = { ...pos, color: isEraser ? "#ffffff" : color, size: brushSize };
    setCurrentAction([point]);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawer) return;
    const pos = getPos(e);
    const point: DrawPoint = { ...pos, color: isEraser ? "#ffffff" : color, size: brushSize };
    const newAction = [...currentAction, point];
    setCurrentAction(newAction);

    // Draw locally
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = currentAction[currentAction.length - 1];
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.size;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAction.length > 1) {
      setHistory(prev => [...prev, { points: currentAction }]);
      // Broadcast
      broadcastChannel.current?.send({
        type: 'broadcast',
        event: 'draw',
        payload: { points: currentAction, drawer_id: user?.id },
      });
    }
    setCurrentAction([]);
  };

  const handleClear = () => {
    clearCanvas();
    setHistory([]);
    broadcastChannel.current?.send({
      type: 'broadcast',
      event: 'clear',
      payload: {},
    });
  };

  const handleGuess = async () => {
    if (!guessText.trim()) return;
    await submitGuess(guessText.trim());
    setGuessText("");
  };

  // Start game (creator picks word for themselves as drawer)
  const handleStartRound = async () => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    await supabase.from('scribble_lobbies').update({
      status: 'playing',
      current_word: word,
      current_drawer_id: user?.id,
      round_number: (lobby?.round_number || 0) + 1,
    }).eq('id', lobbyId);
    clearCanvas();
  };

  const handleLeave = async () => {
    await leaveLobby();
    onLeave();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="h-7 w-7 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-display font-bold text-white text-sm truncate">{lobby?.title || "Scribble"}</h2>
        </div>
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Users className="w-3 h-3" />
          <span>{players.length} spelare</span>
          {lobby?.status === "playing" && (
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
              Runda {lobby.round_number}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Canvas */}
        <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
          {/* Drawing toolbar (only for drawer) */}
          {isDrawer && (
            <div className="flex items-center gap-2 p-2 border-b border-border bg-card flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setIsEraser(false); }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c && !isEraser ? "border-foreground scale-125" : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="w-px h-6 bg-border mx-1" />
              {BRUSH_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                    brushSize === s ? "bg-primary/20 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="rounded-full bg-current" style={{ width: s, height: s }} />
                </button>
              ))}
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant={isEraser ? "default" : "ghost"}
                size="icon"
                onClick={() => setIsEraser(!isEraser)}
                className="h-7 w-7"
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7">
                <Paintbrush className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Word hint for drawer */}
          {isDrawer && lobby?.current_word && (
            <div className="text-center py-1 bg-primary/10 text-primary text-sm font-display font-bold">
              Rita: {lobby.current_word}
            </div>
          )}

          {/* Word hint for guessers */}
          {!isDrawer && lobby?.status === "playing" && lobby?.current_word && (
            <div className="text-center py-1 bg-muted text-muted-foreground text-sm font-display">
              {lobby.current_word.replace(/./g, "_ ")}
            </div>
          )}

          {/* Waiting / Start */}
          {lobby?.status === "waiting" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Paintbrush className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">Väntar på att spelet ska starta...</p>
                {isCreator && (
                  <Button onClick={handleStartRound} className="font-display">
                    Starta runda!
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Canvas */}
          {lobby?.status === "playing" && (
            <div className="flex-1 relative">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                style={{ cursor: isDrawer ? "crosshair" : "default" }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>
          )}
        </div>

        {/* Right: Chat & Players */}
        <div className="w-64 lg:w-72 border-l border-border flex flex-col bg-card shrink-0">
          {/* Players */}
          <div className="border-b border-border">
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 px-3 py-1.5 flex items-center gap-2">
              <Trophy className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-display font-bold text-orange-600">Poäng</span>
            </div>
            <div className="p-2 space-y-1 max-h-32 overflow-y-auto">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className={`truncate ${p.user_id === lobby?.current_drawer_id ? "text-primary font-bold" : "text-foreground"}`}>
                    {p.user_id === lobby?.current_drawer_id ? "🖌️ " : ""}{p.username}
                  </span>
                  <span className="font-mono text-muted-foreground">{p.score}p</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guesses */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {guesses.map((g) => (
                <div key={g.id} className={`text-xs ${g.is_correct ? "text-primary font-bold" : "text-foreground"}`}>
                  <span className="font-bold">{g.username}:</span>{" "}
                  {g.is_correct ? "✅ Rätt svar!" : g.guess}
                </div>
              ))}
              <div ref={guessEndRef} />
            </div>
          </ScrollArea>

          {/* Guess input (non-drawers only) */}
          {!isDrawer && lobby?.status === "playing" && (
            <div className="p-2 border-t border-border flex gap-2">
              <Input
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
                placeholder="Gissa..."
                className="text-sm h-8"
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              />
              <Button size="icon" onClick={handleGuess} className="h-8 w-8 shrink-0">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
