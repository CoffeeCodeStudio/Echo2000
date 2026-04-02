/** Emoticon bar + font toolbar + text input + send button — MSN XP style */
import { useState, useRef, useCallback } from "react";
import { Smile, Image, Gift, Bold, Italic, Underline, Palette, Bell, Type } from "lucide-react";
import { Button } from "../ui/button";
import { MsnEmoticonPicker, quickEmoticons } from "./MsnEmoticons";

interface ChatInputBarProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onNudge?: () => void;
}

const TEXT_COLORS = [
  "#000000", "#c0392b", "#e67e22", "#f1c40f",
  "#27ae60", "#2980b9", "#8e44ad", "#e84393",
  "#1abc9c", "#d35400", "#2c3e50", "#7f8c8d",
];

const FONT_SIZES = [
  { label: "Liten", size: 10 },
  { label: "Normal", size: 14 },
  { label: "Stor", size: 18 },
  { label: "Jättestor", size: 24 },
];

const WINKS = ["💃", "🕺", "😘", "🤗", "🎉", "🌟", "💖", "🔥", "👋", "🎶", "✨", "🦋"];

export function ChatInputBar({ inputMessage, onInputChange, onSend, onFocus, onBlur, onNudge }: ChatInputBarProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showWinks, setShowWinks] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [activeBold, setActiveBold] = useState(false);
  const [activeItalic, setActiveItalic] = useState(false);
  const [activeUnderline, setActiveUnderline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addEmoji = (emoji: string) => {
    onInputChange(inputMessage + emoji);
    setShowEmojis(false);
  };

  const closeAllPopups = () => {
    setShowEmojis(false);
    setShowColorPicker(false);
    setShowFontSize(false);
    setShowImageInput(false);
    setShowWinks(false);
  };

  const wrapSelection = useCallback((tag: string, attr?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = inputMessage;
    const selected = text.substring(start, end);
    const openTag = attr ? `[${tag}=${attr}]` : `[${tag}]`;
    const closeTag = `[/${tag}]`;
    const before = text.substring(0, start);
    const after = text.substring(end);

    if (selected) {
      onInputChange(before + openTag + selected + closeTag + after);
    } else {
      onInputChange(text + openTag + closeTag);
      // Place cursor between tags
      setTimeout(() => {
        ta.focus();
        const cursorPos = (text + openTag).length;
        ta.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  }, [inputMessage, onInputChange]);

  const handleBold = () => {
    closeAllPopups();
    setActiveBold(!activeBold);
    wrapSelection("b");
  };

  const handleItalic = () => {
    closeAllPopups();
    setActiveItalic(!activeItalic);
    wrapSelection("i");
  };

  const handleUnderline = () => {
    closeAllPopups();
    setActiveUnderline(!activeUnderline);
    wrapSelection("u");
  };

  const handleColor = (color: string) => {
    wrapSelection("color", color);
    setShowColorPicker(false);
  };

  const handleFontSize = (size: number) => {
    wrapSelection("size", String(size));
    setShowFontSize(false);
  };

  const handleInsertImage = () => {
    if (imageUrl.trim()) {
      onInputChange(inputMessage + ` 🖼️ ${imageUrl.trim()} `);
      setImageUrl("");
      setShowImageInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      {/* MSN Font Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-gradient-to-b from-[#f6f6f6] to-[#ebebeb] dark:from-gray-800 dark:to-gray-750 border-t border-gray-300 dark:border-gray-600">
        {/* Font size */}
        <div className="relative">
          <button
            className={`p-1 rounded transition-colors ${showFontSize ? "bg-blue-100 dark:bg-blue-900/40" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
            title="Textstorlek"
            onClick={() => { closeAllPopups(); setShowFontSize(!showFontSize); }}
          >
            <Type className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          {showFontSize && (
            <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-1 min-w-[100px]">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.size}
                  onClick={() => handleFontSize(f.size)}
                  className="block w-full text-left px-2 py-1 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                  style={{ fontSize: `${Math.min(f.size, 16)}px` }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bold */}
        <button
          className={`p-1 rounded transition-colors ${activeBold ? "bg-blue-200 dark:bg-blue-800" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
          title="Fetstil [b]...[/b]"
          onClick={handleBold}
        >
          <Bold className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Italic */}
        <button
          className={`p-1 rounded transition-colors ${activeItalic ? "bg-blue-200 dark:bg-blue-800" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
          title="Kursiv [i]...[/i]"
          onClick={handleItalic}
        >
          <Italic className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Underline */}
        <button
          className={`p-1 rounded transition-colors ${activeUnderline ? "bg-blue-200 dark:bg-blue-800" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
          title="Understruken [u]...[/u]"
          onClick={handleUnderline}
        >
          <Underline className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Color */}
        <div className="relative">
          <button
            className={`p-1 rounded transition-colors ${showColorPicker ? "bg-blue-100 dark:bg-blue-900/40" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
            title="Textfärg"
            onClick={() => { closeAllPopups(); setShowColorPicker(!showColorPicker); }}
          >
            <Palette className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2">
              <p className="text-[10px] text-gray-500 mb-1">Välj textfärg:</p>
              <div className="grid grid-cols-4 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColor(color)}
                    className="w-5 h-5 rounded border border-gray-300 hover:scale-125 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Emoticons */}
        <div className="relative">
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={() => { closeAllPopups(); setShowEmojis(!showEmojis); }}
            title="Emoticons"
          >
            <Smile className="w-3.5 h-3.5 text-yellow-600" />
          </button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-1 z-50">
              <MsnEmoticonPicker onSelect={addEmoji} />
            </div>
          )}
        </div>

        {/* Image URL */}
        <div className="relative">
          <button
            className={`p-1 rounded transition-colors ${showImageInput ? "bg-blue-100 dark:bg-blue-900/40" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
            title="Infoga bild-URL"
            onClick={() => { closeAllPopups(); setShowImageInput(!showImageInput); }}
          >
            <Image className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          {showImageInput && (
            <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2 min-w-[200px]">
              <p className="text-[10px] text-gray-500 mb-1">Klistra in bild-URL:</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  onKeyDown={(e) => { if (e.key === "Enter") handleInsertImage(); }}
                />
                <button
                  onClick={handleInsertImage}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Winks */}
        <div className="relative">
          <button
            className={`p-1 rounded transition-colors ${showWinks ? "bg-blue-100 dark:bg-blue-900/40" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
            title="Wink"
            onClick={() => { closeAllPopups(); setShowWinks(!showWinks); }}
          >
            <Gift className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          {showWinks && (
            <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2">
              <p className="text-[10px] text-gray-500 mb-1">Skicka en wink:</p>
              <div className="grid grid-cols-4 gap-1">
                {WINKS.map((w) => (
                  <button
                    key={w}
                    onClick={() => { onInputChange(inputMessage + ` ${w} `); setShowWinks(false); }}
                    className="text-lg hover:scale-125 transition-transform p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Nudge */}
        {onNudge && (
          <button
            className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
            onClick={onNudge}
            title="Nudge"
          >
            <Bell className="w-3.5 h-3.5 text-orange-500" />
          </button>
        )}

        <div className="flex-1" />
        <div className="flex gap-0.5 overflow-x-auto">
          {quickEmoticons.slice(0, 6).map((item) => (
            <button
              key={item.code}
              onClick={() => addEmoji(item.emoji)}
              title={item.code}
              className="text-sm hover:scale-125 transition-transform px-0.5 hover:bg-white/50 rounded flex-shrink-0"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Divider line */}
      <div className="h-px bg-gray-400 dark:bg-gray-500" />

      {/* Text Input */}
      <div className="bg-white dark:bg-gray-900 p-2">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Skriv ett meddelande..."
            rows={2}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-sm px-2 py-1.5 text-[13px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:border-[#316ac5] font-mono"
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={onSend}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white text-xs px-4"
            >
              Skicka
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
