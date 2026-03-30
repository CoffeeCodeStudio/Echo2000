import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  options?: string[];
  isText?: boolean;
  multiSelect?: boolean;
  onChange: (value: string) => void;
}

export function ProfileField({
  label,
  value,
  editValue,
  isEditing,
  options,
  isText,
  multiSelect,
  onChange,
}: ProfileFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedItems = editValue ? editValue.split(", ").filter(Boolean) : [];

  const toggleItem = (item: string) => {
    const next = selectedItems.includes(item)
      ? selectedItems.filter((i) => i !== item)
      : [...selectedItems, item];
    onChange(next.join(", "));
  };

  return (
    <div className="flex flex-col gap-0.5 py-0.5">
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      {isEditing ? (
        isText ? (
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-xs px-1.5 flex-1 min-w-0"
            placeholder="..."
          />
        ) : multiSelect ? (
          <div ref={ref} className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={cn(
                "flex items-center w-full h-7 text-xs px-1.5 rounded border border-input bg-background text-left truncate",
                "hover:border-primary/50 transition-colors"
              )}
            >
              {selectedItems.length > 0 ? (
                <span className="truncate">{selectedItems.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground">Välj...</span>
              )}
            </button>
            {open && (
              <div className="absolute z-50 mt-1 w-56 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
                {options?.map((opt) => {
                  const checked = selectedItems.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleItem(opt)}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-sm px-2 py-1 text-xs cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground",
                        checked && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <span className={cn(
                        "flex items-center justify-center w-3.5 h-3.5 rounded border text-[10px]",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}>
                        {checked && "✓"}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <Select value={editValue || ""} onValueChange={onChange}>
            <SelectTrigger className="h-7 text-xs px-1.5 flex-1 min-w-0">
              <SelectValue placeholder="Välj..." />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <span className="text-primary text-xs font-medium break-words leading-snug">{value || "–"}</span>
      )}
    </div>
  );
}
