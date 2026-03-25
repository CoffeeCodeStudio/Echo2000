/**
 * @module ProfileBioStatus
 * Presentation (bio + ASCII art), and member-since footer sections.
 */
import { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EditableProfileData } from "./profile-constants";

const ASCII_CHARS = ["█", "▓", "▒", "░", "▄", "▀", "─", "│", "┼", "╔", "╗", "╚", "╝"];

interface ProfileBioStatusProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  memberSince: string;
}

export function ProfileBioStatus({ displayData, editData, setEditData, isEditing, memberSince }: ProfileBioStatusProps) {
  const [asciiMode, setAsciiMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentText = asciiMode ? editData.ascii_presentation : editData.bio;
  const charCount = currentText.length;

  const insertChar = (char: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const field = asciiMode ? "ascii_presentation" : "bio";
    const value = asciiMode ? editData.ascii_presentation : editData.bio;
    if (value.length >= 2000) return;
    const newValue = value.slice(0, start) + char + value.slice(end);
    setEditData({ ...editData, [field]: newValue.slice(0, 2000) });
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + char.length;
      ta.focus();
    });
  };

  const displayBio = displayData.bio;
  const displayAscii = displayData.ascii_presentation;

  return (
    <>
      {/* Presentation */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Presentation</h3>

        {isEditing ? (
          <div className="space-y-2">
            {/* ASCII Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAsciiMode(!asciiMode)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase border rounded transition-colors",
                  asciiMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                ASCII-LÄGE
              </button>

              <div className="h-4 w-px bg-border mx-0.5" />

              {ASCII_CHARS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertChar(char)}
                  className="w-6 h-6 flex items-center justify-center text-xs font-mono bg-muted border border-border rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                  title={`Infoga ${char}`}
                >
                  {char}
                </button>
              ))}

              <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                {charCount}/2000
              </span>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={currentText}
              onChange={(e) => {
                const field = asciiMode ? "ascii_presentation" : "bio";
                setEditData({ ...editData, [field]: e.target.value.slice(0, 2000) });
              }}
              rows={asciiMode ? 10 : 3}
              maxLength={2000}
              className={cn(
                "text-sm resize-none",
                asciiMode && "font-mono tracking-[0px]"
              )}
              style={{
                whiteSpace: "pre",
                ...(asciiMode ? { fontFamily: "'Courier New', monospace", letterSpacing: "0px" } : {}),
              }}
              placeholder={asciiMode ? "Rita din ASCII-konst här..." : "Berätta lite om dig själv..."}
            />

            {asciiMode && (
              <p className="text-[10px] text-muted-foreground">
                Tips: Använd knapparna ovan för att infoga specialtecken. Radbrytningar bevaras.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Regular bio */}
            {displayBio && (
              <p className="text-sm text-foreground/80">{displayBio}</p>
            )}

            {/* ASCII presentation */}
            {displayAscii && (
              <pre
                style={{
                  fontFamily: "'Courier New', monospace",
                  lineHeight: 1.1,
                  letterSpacing: "0px",
                  whiteSpace: "pre",
                  overflowX: "auto",
                  fontSize: "12px",
                }}
                className="text-foreground/90"
              >
                {displayAscii}
              </pre>
            )}

            {!displayBio && !displayAscii && (
              <p className="text-sm text-foreground/80">Ingen beskrivning ännu...</p>
            )}
          </div>
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
