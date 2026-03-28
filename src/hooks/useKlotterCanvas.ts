/**
 * @module useKlotterCanvas
 * All drawing state, canvas logic, undo/redo, clear, download and publish
 * for the Klotterplanket component.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKlotter } from "@/hooks/useKlotter";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "@/components/SharedLayout";

/** Drawing point with color and size */
export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface DrawAction {
  points: DrawPoint[];
}

export const COLORS = [
  "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981",
  "#EF4444", "#EC4899", "#F4D06F", "#FFFFFF", "#1e2540",
];
export const MOBILE_COLORS = [COLORS[0], COLORS[1], COLORS[2], COLORS[4], COLORS[7]];
export const BRUSH_SIZES = [4, 8, 14, 22, 32];
export const BG_COLOR = "#1e2540";

export function useKlotterCanvas() {
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
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("gallery");
  const [isPublishing, setIsPublishing] = useState(false);

  const { klotter, loading: klotterLoading, uploadAndSaveKlotter, deleteKlotter } = useKlotter();
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;

  // Keep a ref to history/historyIndex so the resize handler always has current data
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  // ---------------------------------------------------------------------------
  // Side-effects
  // ---------------------------------------------------------------------------

  // Hide navbar only when publish modal is open on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar) {
      setHideNavbar(showPublishModal);
    }
    return () => { if (setHideNavbar) setHideNavbar(false); };
  }, [showPublishModal, isMobile, setHideNavbar]);

  /**



  /**
   * Draw a list of actions onto the context.
   * Assumes the DPR transform is already applied.
   */
  const drawActions = useCallback((ctx: CanvasRenderingContext2D, actions: DrawAction[], upTo: number) => {
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i <= upTo; i++) {
      const action = actions[i];
      if (!action) continue;
      action.points.forEach((point, idx) => {
        if (idx === 0) return;
        const prev = action.points[idx - 1];
        ctx.beginPath();
        ctx.moveTo(prev.x * dpr, prev.y * dpr);
        ctx.lineTo(point.x * dpr, point.y * dpr);
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.size * dpr;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });
    }
    ctx.restore();
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas redraw
  // ---------------------------------------------------------------------------

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, rect.width * dpr, rect.height * dpr);
    drawActions(ctx, history, historyIndex);
  }, [history, historyIndex, drawActions]);

  /**
   * Same as redrawCanvas but reads from refs — used by the resize handler
   * so it always has the latest history regardless of closure staleness.
   */
  const redrawFromRefs = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, rect.width * dpr, rect.height * dpr);
    drawActions(ctx, historyRef.current, historyIndexRef.current);
  }, [drawActions]);

  // Initialize canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Set the canvas bitmap size to match display pixels
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      // Redraw with current history (from refs to avoid stale closure)
      redrawFromRefs();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redrawFromRefs]);

  useEffect(() => { redrawCanvas(); }, [historyIndex, redrawCanvas]);

  // ---------------------------------------------------------------------------
  // Pointer handlers
  // ---------------------------------------------------------------------------

  /**
   * Convert a pointer event to CSS-space coordinates relative to the canvas.
   * Uses clientX/clientY (not pageX/pageY) to avoid scroll-offset issues.
   * The ratio canvas.width/rect.width naturally equals devicePixelRatio,
   * but computing it from the actual values handles any CSS transforms too.
   */
  const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Scale from CSS pixels to canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX / dpr,
      y: (e.clientY - rect.top) * scaleY / dpr,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Capture the pointer so we receive events even if finger/cursor moves outside
    (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
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

    const dpr = window.devicePixelRatio || 1;
    const currentColor = isEraser ? BG_COLOR : color;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x * dpr, lastPoint.y * dpr);
    ctx.lineTo(pos.x * dpr, pos.y * dpr);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    setCurrentAction((prev) => [...prev, { ...pos, color: currentColor, size: brushSize }]);
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

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const undo = () => { if (historyIndex >= 0) setHistoryIndex(historyIndex - 1); };
  const redo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  const clearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
    if (success) {
      setShowPublishModal(false);
      setPublishComment("");
      clearCanvas();
      setActiveTab("gallery");
    }
    setIsPublishing(false);
  };

  const selectColor = (c: string) => {
    setColor(c);
    setIsEraser(false);
  };

  const toggleEraser = () => setIsEraser(!isEraser);

  return {
    // Refs
    canvasRef,

    // Canvas state
    color,
    brushSize,
    isEraser,
    historyIndex,
    historyLength: history.length,

    // Pointer handlers
    startDrawing,
    draw,
    stopDrawing,

    // Actions
    undo,
    redo,
    clearCanvas,
    downloadCanvas,
    adjustBrushSize,
    selectColor,
    toggleEraser,

    // Publish
    showPublishModal,
    setShowPublishModal,
    publishComment,
    setPublishComment,
    handlePublish,
    isPublishing,

    // Tabs
    activeTab,
    setActiveTab,

    // Gallery data
    klotter,
    klotterLoading,
    deleteKlotter,

    // Misc
    isMobile,
    user,
  };
}
