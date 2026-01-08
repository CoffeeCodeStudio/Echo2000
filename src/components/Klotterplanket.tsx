import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Palette, Trash2, Download, Undo, Redo, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface DrawAction {
  points: DrawPoint[];
}

const COLORS = [
  "#E8A87C", // warm coral (primary)
  "#C38CD4", // soft lavender (accent)
  "#7BC8A4", // soft green
  "#F4D06F", // warm yellow
  "#FF6B6B", // soft red
  "#6B9FFF", // soft blue
  "#FFB5E8", // pink
  "#FFFFFF", // white
  "#2D2D3A", // dark
];

const BRUSH_SIZES = [4, 8, 14, 22, 32];

export function Klotterplanket() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentAction, setCurrentAction] = useState<DrawPoint[]>([]);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Fill with background
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Redraw history
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all actions up to current index
    for (let i = 0; i <= historyIndex; i++) {
      const action = history[i];
      if (!action) continue;
      
      action.points.forEach((point, idx) => {
        if (idx === 0) return;
        const prevPoint = action.points[idx - 1];
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });
    }
  }, [history, historyIndex]);

  useEffect(() => {
    redrawCanvas();
  }, [historyIndex, redrawCanvas]);

  const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPosition(e);
    if (!pos) return;

    setIsDrawing(true);
    setLastPoint(pos);
    
    const point: DrawPoint = {
      x: pos.x,
      y: pos.y,
      color: isEraser ? "#1a1a24" : color,
      size: brushSize,
    };
    setCurrentAction([point]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPosition(e);
    if (!pos) return;

    const currentColor = isEraser ? "#1a1a24" : color;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    const point: DrawPoint = {
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: brushSize,
    };
    setCurrentAction(prev => [...prev, point]);
    setLastPoint(pos);
  };

  const stopDrawing = () => {
    if (isDrawing && currentAction.length > 0) {
      // Remove future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ points: currentAction });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    setIsDrawing(false);
    setLastPoint(null);
    setCurrentAction([]);
  };

  const undo = () => {
    if (historyIndex >= 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = "klotterplanket.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const adjustBrushSize = (delta: number) => {
    const currentIndex = BRUSH_SIZES.indexOf(brushSize);
    const newIndex = Math.max(0, Math.min(BRUSH_SIZES.length - 1, currentIndex + delta));
    setBrushSize(BRUSH_SIZES[newIndex]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="nostalgia-card flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="font-display font-bold text-xl flex items-center gap-2">
            🎨 Klotterplanket
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rita, klottra och skapa tillsammans!
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
          {/* Colors */}
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-muted-foreground mr-1" />
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={cn(
                  "w-7 h-7 rounded-full transition-all border-2",
                  color === c && !isEraser
                    ? "border-foreground scale-110 shadow-lg"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Brush size */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => adjustBrushSize(-1)}
              disabled={brushSize === BRUSH_SIZES[0]}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div 
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
              style={{ backgroundColor: isEraser ? "#1a1a24" : color }}
            >
              <div 
                className="rounded-full bg-foreground/80"
                style={{ 
                  width: Math.min(brushSize, 24), 
                  height: Math.min(brushSize, 24) 
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => adjustBrushSize(1)}
              disabled={brushSize === BRUSH_SIZES[BRUSH_SIZES.length - 1]}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Tools */}
          <Button
            variant={isEraser ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsEraser(!isEraser)}
            className="gap-1.5"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Sudd</span>
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={undo}
            disabled={historyIndex < 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Rensa</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Spara</span>
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ cursor: isEraser ? "crosshair" : "crosshair" }}
          />
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border text-center text-xs text-muted-foreground">
          ✨ Dina klotter sparas lokalt • Rita med musen eller pekskärm
        </div>
      </div>
    </div>
  );
}
