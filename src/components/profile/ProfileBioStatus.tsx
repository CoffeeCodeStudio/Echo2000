/**
 * @module ProfileBioStatus
 * Presentation (BBCode-formatted) and member-since footer sections.
 */
import { useRef, useState, useCallback } from "react";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseBBCode } from "@/lib/bbcode";
import type { EditableProfileData } from "./profile-constants";

const ASCII_CHARS = ["█", "▓", "▒", "░", "▄", "▀", "─", "│", "╔", "╗", "╚", "╝"];

const TOOLBAR_BUTTONS: { label: string; tag: string; endTag: string; title: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean }[] = [
  { label: "B", tag: "[b]", endTag: "[/b]", title: "Fetstil", bold: true },
  { label: "I", tag: "[i]", endTag: "[/i]", title: "Kursiv", italic: true },
  { label: "U", tag: "[u]", endTag: "[/u]", title: "Understruken", underline: true },
  { label: "S", tag: "[s]", endTag: "[/s]", title: "Genomstruken", strike: true },
  { label: "CENTER", tag: "[center]", endTag: "[/center]", title: "Centrera" },
  { label: "KOD", tag: "[code]", endTag: "[/code]", title: "Kodblock (ASCII-art)" },
];

interface ProfileBioStatusProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  memberSince: string;
}

export function ProfileBioStatus({ displayData, editData, setEditData, isEditing, memberSince }: ProfileBioStatusProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const wrapSelection = useCallback((openTag: string, closeTag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = editData.presentation;
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + openTag + selected + closeTag + text.slice(end);
    setEditData({ ...editData, presentation: newText.slice(0, 2000) });
    requestAnimationFrame(() => {
      const cursorPos = start + openTag.length + selected.length + closeTag.length;
      ta.selectionStart = ta.selectionEnd = selected.length > 0 ? cursorPos : start + openTag.length;
      ta.focus();
    });
  }, [editData, setEditData]);

  const insertChar = useCallback((char: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = editData.presentation;
    if (text.length >= 2000) return;
    const newText = text.slice(0, start) + char + text.slice(end);
    setEditData({ ...editData, presentation: newText.slice(0, 2000) });
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + char.length;
      ta.focus();
    });
  }, [editData, setEditData]);

  const handleColorInsert = useCallback((color: string) => {
    wrapSelection(`[color=${color}]`, "[/color]");
    setShowColorPicker(false);
  }, [wrapSelection]);

  const QUICK_COLORS = ["#FF0000", "#FF6600", "#FFCC00", "#00CC00", "#0066FF", "#9900FF", "#FF00CC", "#FFFFFF", "#CCCCCC", "#666666"];

  const presentationText = displayData.presentation;

  return (
    <>
      {/* Presentation */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Presentation</h3>

        {isEditing ? (
          <div className="space-y-2">
            {/* BBCode Toolbar */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/30 border border-border rounded p-1.5">
              {/* Format buttons */}
              {TOOLBAR_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => wrapSelection(btn.tag, btn.endTag)}
                  className={cn(
                    "px-1.5 py-0.5 text-[11px] border border-border rounded bg-card hover:bg-accent hover:text-accent-foreground transition-colors",
                    btn.bold && "font-bold",
                    btn.italic && "italic",
                    btn.underline && "underline",
                    btn.strike && "line-through"
                  )}
                  title={btn.title}
                >
                  {btn.label}
                </button>
              ))}

              {/* Color picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={cn(
                    "px-1.5 py-0.5 text-[11px] border border-border rounded transition-colors",
                    showColorPicker
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-accent hover:text-accent-foreground"
                  )}
                  title="Färg"
                >
                  FÄRG
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded p-1.5 shadow-lg flex flex-wrap gap-1 w-[130px]">
                    {QUICK_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorInsert(color)}
                        className="w-5 h-5 rounded border border-border/60 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-border mx-0.5" />

              {/* ASCII quick chars */}
              {ASCII_CHARS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertChar(char)}
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-mono bg-card border border-border rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                  title={`Infoga ${char}`}
                >
                  {char}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                {/* Preview toggle */}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 text-[10px] border border-border rounded transition-colors",
                    showPreview
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={showPreview ? "Dölj förhandsgranskning" : "Visa förhandsgranskning"}
                >
                  {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span className="hidden sm:inline">PREVIEW</span>
                </button>

                {/* Char counter */}
                <span className="text-[10px] text-muted-foreground font-mono">
                  {editData.presentation.length}/2000
                </span>
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={editData.presentation}
              onChange={(e) => {
                setEditData({ ...editData, presentation: e.target.value.slice(0, 2000) });
              }}
              rows={10}
              maxLength={2000}
              className="text-sm resize-none font-mono"
              style={{ whiteSpace: "pre", fontFamily: "'Courier New', monospace", letterSpacing: "0px" }}
              placeholder="Skriv din presentation här... Använd BBCode för formatering: [b]fetstil[/b], [i]kursiv[/i], [color=#FF0000]färg[/color]"
            />

            {/* Live Preview */}
            {showPreview && (
              <div className="border border-border rounded p-3 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1.5">Förhandsgranskning:</p>
                <div
                  className="text-sm text-foreground/90"
                  style={{ wordBreak: "break-word", overflowX: "auto", maxWidth: "100%" }}
                  dangerouslySetInnerHTML={{ __html: parseBBCode(editData.presentation) }}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {presentationText ? (
              <div
                className="text-sm text-foreground/80"
                style={{ wordBreak: "break-word", overflowX: "auto", maxWidth: "100%" }}
                dangerouslySetInnerHTML={{ __html: parseBBCode(presentationText) }}
              />
            ) : (
              <p className="text-sm text-foreground/80">Ingen presentation ännu...</p>
            )}
          </>
        )}
      </div>

      {/* Member Since */}
      <div className="border-t border-border px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Medlem sedan {memberSince}</span>
        </div>
      </div>
    </>
  );
}
