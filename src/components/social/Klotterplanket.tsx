/**
 * Klotterplanket – Drawing/graffiti wall with canvas, gallery and publish flow.
 * Sub-components: KlotterToolbar, KlotterGallery, KlotterPublishModal
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKlotter } from "@/hooks/useKlotter";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "../SharedLayout";

import { KlotterToolbar } from "./KlotterToolbar";
import { KlotterGallery } from "./KlotterGallery";
import { KlotterPublishModal } from "./KlotterPublishModal";

/** Drawing point with color and size */
interface DrawPoint { x: number; y: number; color: string; size: number; }
interface DrawAction { points: DrawPoint[]; }

const COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444", "#EC4899", "#F4D06F", "#FFFFFF", "#1e2540"];
const MOBILE_COLORS = [COLORS[0], COLORS[1], COLORS[2], COLORS[4], COLORS[7]];
const BRUSH_SIZES = [4, 8, 14, 22, 32];
const BG_COLOR = "#1e2540";

export function Klotterplanket() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(isMobile ? 12 : 8);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentAction, setCurrentAction] = useState<DrawPoint[]>([]);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishComment, setPublishComment] = useState("");
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [isPublishing, setIsPublishing] = useState(false);

  const { klotter, loading: klotterLoading, uploadAndSaveKlotter } = useKlotter();
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;

  // Hide navbar when drawing on mobile OR when publish modal is open
  useEffect(() => {
    if (isMobile && setHideNavbar) {
      setHideNavbar(showPublishModal || activeTab === "draw");
    }
    return () => { if (setHideNavbar) setHideNavbar(false); };
  }, [showPublishModal, isMobile, setHideNavbar, activeTab]);

  // Initialize canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, rect.width, rect.height);
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

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let i = 0; i <= historyIndex; i++) {
      const action = history[i];
      if (!action) continue;
      action.points.forEach((point, idx) => {
        if (idx === 0) return;
        const prev = action.points[idx - 1];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });
    }
  }, [history, historyIndex]);

  useEffect(() => { redrawCanvas(); }, [historyIndex, redrawCanvas]);

  /** Get pointer position relative to canvas using getBoundingClientRect */
  const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPosition(e);
    if (!pos) return;
    setIsDrawing(true);
    setLastPoint(pos);
    setCurrentAction([{ ...pos, color: isEraser ? BG_COLOR : color, size: brushSize }]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const pos = getPointerPosition(e);
    if (!ctx || !pos) return;

    const currentColor = isEraser ? BG_COLOR : color;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setCurrentAction(prev => [...prev, { ...pos, color: currentColor, size: brushSize }]);
    setLastPoint(pos);
  };

  const stopDrawing = () => {
    if (isDrawing && currentAction.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ points: currentAction });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsDrawing(false);
    setLastPoint(null);
    setCurrentAction([]);
  };

  const undo = () => { if (historyIndex >= 0) setHistoryIndex(historyIndex - 1); };
  const redo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  const clearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) { ctx.fillStyle = BG_COLOR; ctx.fillRect(0, 0, canvas.width, canvas.height); }
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
    const idx = BRUSH_SIZES.indexOf(brushSize);
    setBrushSize(BRUSH_SIZES[Math.max(0, Math.min(BRUSH_SIZES.length - 1, idx + delta))]);
  };

  const handlePublish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    setIsPublishing(true);
    const success = await uploadAndSaveKlotter(canvas.toDataURL("image/png"), publishComment);
    if (success) { setShowPublishModal(false); setPublishComment(""); clearCanvas(); setActiveTab("gallery"); }
    setIsPublishing(false);
  };

  const previewDataUrl = canvasRef.current?.toDataURL("image/png");
  const toolbarColors = isMobile ? MOBILE_COLORS : COLORS;

  // Tab switcher shared between mobile and desktop
  const TabSwitcher = ({ className: cls }: { className?: string }) => (
    <div className={cn("flex gap-1 bg-muted rounded-lg p-1", cls)}>
      {(["draw", "gallery"] as const).map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          {tab === "draw" ? (isMobile ? "🎨 Rita" : "Rita") : (isMobile ? "🖼️ Galleri" : `Galleri (${klotter.length})`)}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("flex-1 flex flex-col overflow-hidden", !isMobile && "p-4")}>
      <div className={cn("nostalgia-card flex-1 flex flex-col overflow-hidden", isMobile && "mx-2 my-2 rounded-lg")}>
        {/* Header */}
        <div className={cn("border-b border-border", isMobile ? "p-3 flex items-center justify-between" : "p-4")}>
          {!isMobile && (
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-display font-bold text-xl flex items-center gap-2">🎨 Klotterplanket</h1>
              <TabSwitcher />
            </div>
          )}
          {isMobile && <TabSwitcher />}
          {isMobile && activeTab === "draw" && (
            <Button size="sm" onClick={() => setShowPublishModal(true)} disabled={historyIndex < 0} className="gap-1 text-xs bg-primary">
              <Send className="w-3 h-3" />Publicera
            </Button>
          )}
          {!isMobile && <p className="text-sm text-muted-foreground">{activeTab === "draw" ? "Rita, klottra och publicera!" : "Se vad andra har klottrat"}</p>}
        </div>

        {activeTab === "draw" ? (
          <>
            <KlotterToolbar
              colors={toolbarColors} activeColor={color} brushSize={brushSize} brushSizes={BRUSH_SIZES}
              isEraser={isEraser} canUndo={historyIndex >= 0} canRedo={historyIndex < history.length - 1}
              canPublish={historyIndex >= 0} isMobile={isMobile}
              onColorChange={(c) => { setColor(c); setIsEraser(false); }} onEraserToggle={() => setIsEraser(!isEraser)}
              onBrushSizeAdjust={adjustBrushSize} onUndo={undo} onRedo={redo} onClear={clearCanvas}
              onDownload={downloadCanvas} onPublish={() => setShowPublishModal(true)}
            />
            <div className="flex-1 relative overflow-hidden">
              <canvas ref={canvasRef} onPointerDown={startDrawing} onPointerMove={draw}
                onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
                className="absolute inset-0 w-full h-full touch-none" style={{ cursor: "crosshair" }} />
            </div>
          </>
        ) : (
          <div className={cn("flex-1 overflow-y-auto scrollbar-nostalgic", isMobile ? "p-2" : "p-4")}>
            <KlotterGallery klotter={klotter} loading={klotterLoading} isMobile={isMobile} onSwitchToDraw={() => setActiveTab("draw")} />
          </div>
        )}

        {!isMobile && (
          <div className="p-2 border-t border-border text-center text-xs text-muted-foreground">
            ✨ Klottra fritt • Rita med musen eller pekskärm
          </div>
        )}
      </div>

      {showPublishModal && (
        <KlotterPublishModal isMobile={isMobile} isPublishing={isPublishing} canPublish={!!user}
          comment={publishComment} onCommentChange={setPublishComment}
          onPublish={handlePublish} onClose={() => setShowPublishModal(false)}
          previewDataUrl={previewDataUrl} />
      )}
    </div>
  );
}
