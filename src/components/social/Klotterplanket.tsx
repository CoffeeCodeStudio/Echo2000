import { useRef, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Eraser, Palette, Trash2, Download, Undo, Redo, Minus, Plus, Send, X, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKlotter } from "@/hooks/useKlotter";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "../SharedLayout";

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
  "#F59E0B", // LunarStorm orange (primary)
  "#3B82F6", // Ljusblå (accent)
  "#8B5CF6", // Lila (secondary)
  "#10B981", // Grön
  "#EF4444", // Röd
  "#EC4899", // Rosa
  "#F4D06F", // Gul
  "#FFFFFF", // Vit
  "#1e2540", // Mörk
];

const BRUSH_SIZES = [4, 8, 14, 22, 32];

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
  
  // Publishing state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishComment, setPublishComment] = useState("");
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [isPublishing, setIsPublishing] = useState(false);

  // Database integration
  const { klotter, loading: klotterLoading, uploadAndSaveKlotter } = useKlotter();
  const { user } = useAuth();

  // Get layout context for hiding navbar
  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;
  
  // Hide navbar when drawing on mobile OR when publish modal is open
  useEffect(() => {
    if (isMobile && setHideNavbar) {
      // Hide navbar when actively drawing OR when publish modal is open
      setHideNavbar(showPublishModal || (activeTab === "draw" && isDrawing));
    }
    return () => {
      if (setHideNavbar) setHideNavbar(false);
    };
  }, [showPublishModal, isMobile, setHideNavbar, activeTab, isDrawing]);

  // Also hide navbar when drawing tab is active on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar && activeTab === "draw") {
      setHideNavbar(true);
    } else if (isMobile && setHideNavbar && activeTab === "gallery") {
      setHideNavbar(false);
    }
  }, [activeTab, isMobile, setHideNavbar]);

  // Simplified mobile colors
  const mobileColors = [COLORS[0], COLORS[1], COLORS[2], COLORS[4], COLORS[7]];

  // Initialize canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set canvas internal size to match display size * DPR for sharp rendering
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale the context to handle DPR
      ctx.scale(dpr, dpr);
      
      ctx.fillStyle = "#1e2540";
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
    
    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = "#1e2540";
    ctx.fillRect(0, 0, rect.width, rect.height);

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

  // Get accurate pointer position using getBoundingClientRect
  const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both pointer events and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate position relative to canvas using getBoundingClientRect for accuracy
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
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
      color: isEraser ? "#1e2540" : color,
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

    const currentColor = isEraser ? "#1e2540" : color;

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
    
    ctx.fillStyle = "#1e2540";
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

  const handlePublish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    
    setIsPublishing(true);
    const imageData = canvas.toDataURL("image/png");
    
    const success = await uploadAndSaveKlotter(imageData, publishComment);
    
    if (success) {
      setShowPublishModal(false);
      setPublishComment("");
      clearCanvas();
      setActiveTab("gallery");
    }
    setIsPublishing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just nu";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min sedan`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} tim sedan`;
    return `${Math.floor(hours / 24)} dagar sedan`;
  };

  // Mobile simplified UI
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="nostalgia-card flex-1 flex flex-col overflow-hidden mx-2 my-2 rounded-lg">
          {/* Simple mobile header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveTab("draw")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeTab === "draw" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                🎨 Rita
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeTab === "gallery" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                🖼️ Galleri
              </button>
            </div>
            {activeTab === "draw" && (
              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                disabled={historyIndex < 0}
                className="gap-1 text-xs bg-primary"
              >
                <Send className="w-3 h-3" />
                Publicera
              </Button>
            )}
          </div>

          {activeTab === "draw" ? (
            <>
              {/* Simplified mobile toolbar */}
              <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30">
                {/* Colors - fewer on mobile */}
                <div className="flex items-center gap-1">
                  {mobileColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setIsEraser(false);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all border-2",
                        color === c && !isEraser
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={isEraser ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEraser(!isEraser)}
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
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
                    className="h-8 w-8 text-destructive"
                    onClick={clearCanvas}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
                  style={{ cursor: "crosshair" }}
                />
              </div>
            </>
          ) : (
            /* Mobile Gallery */
            <div className="flex-1 overflow-y-auto p-2 scrollbar-nostalgic">
              {klotter.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{klotterLoading ? "Laddar..." : "Inga klotter än!"}</p>
                  {!klotterLoading && (
                    <Button 
                      onClick={() => setActiveTab("draw")} 
                      variant="link" 
                      className="text-primary text-sm"
                    >
                      Bli först att rita
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {klotter.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-card rounded-lg overflow-hidden border border-border"
                    >
                      <div className="aspect-video bg-[#1e2540] relative">
                        {(item.signed_url || item.image_url) ? (
                          <img 
                            src={item.signed_url || item.image_url} 
                            alt="Klotter" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">🎨</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="flex items-center gap-1">
                          <Avatar name={item.author_name} size="sm" />
                          <span className="text-xs font-medium truncate">{item.author_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Publish Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
            <div className="bg-card w-full rounded-t-2xl p-4 animate-slide-in-bottom">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Publicera klotter</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPublishModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <textarea
                value={publishComment}
                onChange={(e) => setPublishComment(e.target.value)}
                placeholder="Lägg till en kommentar..."
                className="w-full p-3 rounded-lg bg-muted border border-border text-sm resize-none"
                rows={2}
              />
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !user}
                className="w-full mt-3 bg-primary"
              >
                <Send className="w-4 h-4 mr-2" />
                {isPublishing ? "Publicerar..." : !user ? "Logga in först" : "Publicera"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="nostalgia-card flex-1 flex flex-col overflow-hidden">
        {/* Header with tabs */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              🎨 Klotterplanket
            </h1>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveTab("draw")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === "draw" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Rita
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === "gallery" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Galleri ({klotter.length})
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTab === "draw" ? "Rita, klottra och publicera!" : "Se vad andra har klottrat"}
          </p>
        </div>

        {activeTab === "draw" ? (
          <>
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
                  style={{ backgroundColor: isEraser ? "#1e2540" : color }}
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
              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                disabled={historyIndex < 0}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
                Publicera
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
                style={{ cursor: "crosshair" }}
              />
            </div>
          </>
        ) : (
          /* Gallery */
          <div className="flex-1 overflow-y-auto p-4 scrollbar-nostalgic">
            {klotter.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{klotterLoading ? "Laddar klotter..." : "Inga klotter publicerade än!"}</p>
                {!klotterLoading && (
                  <Button 
                    onClick={() => setActiveTab("draw")} 
                    variant="link" 
                    className="text-primary"
                  >
                    Bli först att rita något
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {klotter.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                  >
                    {/* Image or placeholder */}
                    <div className="aspect-video bg-[#1e2540] relative">
                      {(item.signed_url || item.image_url) ? (
                        <img 
                          src={item.signed_url || item.image_url} 
                          alt="Klotter" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <span className="text-4xl">🎨</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar name={item.author_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.author_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                      {item.comment && (
                        <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          {item.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t border-border text-center text-xs text-muted-foreground">
          ✨ Klottra fritt • Rita med musen eller pekskärm
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-bold text-lg">Publicera klotter</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPublishModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {/* Preview */}
              <div className="aspect-video bg-[#1e2540] rounded-lg overflow-hidden mb-4">
                {canvasRef.current && (
                  <img 
                    src={canvasRef.current.toDataURL("image/png")} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              {/* Comment input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Lägg till en kommentar (valfritt)
                </label>
                <textarea
                  value={publishComment}
                  onChange={(e) => setPublishComment(e.target.value)}
                  placeholder="Skriv något om ditt klotter..."
                  rows={2}
                  maxLength={200}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {publishComment.length}/200
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPublishModal(false)}
                >
                  Avbryt
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handlePublish}
                  disabled={isPublishing || !user}
                >
                  <Send className="w-4 h-4" />
                  {isPublishing ? "Publicerar..." : !user ? "Logga in först" : "Publicera"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
