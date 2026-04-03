/**
 * @module bbcode
 * BBCode parser for old-school forum-style formatting (LunarStorm / vBulletin).
 *
 * Sanitises raw HTML before parsing to prevent XSS, then converts supported
 * BBCode tags into safe HTML.
 */

/** Strip all raw HTML tags to prevent XSS – runs BEFORE BBCode parsing. */
function stripHtml(input: string): string {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Safe CSS named colors (lowercase). */
const NAMED_COLORS = new Set([
  "black","white","red","green","blue","yellow","orange","purple","pink",
  "brown","gray","grey","cyan","magenta","lime","navy","teal","maroon",
  "olive","aqua","fuchsia","silver","gold","coral","salmon","tomato",
  "crimson","indigo","violet","plum","orchid","khaki","beige","ivory",
  "linen","wheat","tan","chocolate","sienna","peru","firebrick",
  "darkred","darkgreen","darkblue","darkcyan","darkmagenta","darkorange",
  "darkviolet","deeppink","deepskyblue","dodgerblue","forestgreen",
  "hotpink","lawngreen","lightblue","lightcoral","lightgreen","lightpink",
  "lightyellow","mediumblue","orangered","royalblue","seagreen",
  "skyblue","slategray","springgreen","steelblue","turquoise",
]);

/** Validate a color value: hex or named CSS color. */
function sanitizeColor(raw: string): string | null {
  const trimmed = raw.trim();
  // Hex color
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3,6})$/);
  if (hexMatch) return `#${hexMatch[1]}`;
  // Named color
  if (NAMED_COLORS.has(trimmed.toLowerCase())) return trimmed.toLowerCase();
  return null;
}

/** Clamp font-size between 10 and 32. */
function clampSize(raw: string): number {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return 14;
  return Math.max(10, Math.min(32, n));
}

/**
 * Parse a BBCode string into sanitised HTML.
 *
 * Supported tags:
 * - `[b]`, `[i]`, `[u]`, `[s]`
 * - `[center]`
 * - `[color=#HEX]`
 * - `[size=N]` (10–32 px)
 * - `[code]` (monospace / ASCII-art block – content is left literal)
 *
 * Newlines are converted to `<br>` (except inside `[code]` blocks where
 * they are preserved by the `<pre>` element).
 */
export function parseBBCode(input: string): string {
  // 0. Detect corrupted pixel-art BBCode (more than 500 [color= tags per line)
  const lines = input.split('\n');
  const isCorrupted = lines.some(line => {
    const count = (line.match(/\[color=/gi) || []).length;
    if (import.meta.env.DEV && count > 100) {
      console.log('🔍 BBCode line has', count, 'color tags');
    }
    return count > 500;
  });
  if (isCorrupted) {
    if (import.meta.env.DEV) console.error('❌ BBCode BLOCKED: Over 500 color tags');
    return '<div style="color:#ff6b6b;background:rgba(255,0,0,0.1);padding:12px;border-radius:4px;margin:8px 0"><strong>⚠️ För många färgtaggar</strong><br>Din pixel-art har över 500 färger per rad. Förenkla bilden eller använd en bild istället.</div>';
  }

  // 1. Escape raw HTML
  let s = stripHtml(input);

  // 2. Extract [code]...[/code] blocks into placeholders so inner tags stay literal
  const codeBlocks: string[] = [];
  s = s.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    (_m, content: string) => {
      const idx = codeBlocks.length;
      codeBlocks.push(
        `<pre style="font-family:'Courier New',monospace;line-height:1.1;letter-spacing:0px;white-space:pre;overflow-x:auto;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;font-size:12px">${content}</pre>`
      );
      return `__CODE_BLOCK_${idx}__`;
    }
  );

  // 3. Simple tag pairs (only on non-code text)
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  s = s.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");
  s = s.replace(
    /\[center\]([\s\S]*?)\[\/center\]/gi,
    '<div style="text-align:center">$1</div>'
  );

  // 4. [color=#HEX]
  s = s.replace(
    /\[color=(#?[0-9a-fA-F]{3,6})\]([\s\S]*?)\[\/color\]/gi,
    (_m, rawColor: string, content: string) => {
      const color = sanitizeColor(rawColor);
      if (!color) return content;
      return `<span style="color:${color}">${content}</span>`;
    }
  );

  // 5. [size=N]
  s = s.replace(
    /\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi,
    (_m, rawSize: string, content: string) => {
      const size = clampSize(rawSize);
      return `<span style="font-size:${size}px">${content}</span>`;
    }
  );

  // 6. Newlines → <br> only OUTSIDE <pre> blocks (placeholders are single-line tokens)
  // Split on placeholders, convert \n→<br> only in non-placeholder segments
  const parts = s.split(/(__CODE_BLOCK_\d+__)/);
  s = parts
    .map((part) =>
      /^__CODE_BLOCK_\d+__$/.test(part) ? part : part.replace(/\n/g, "<br>")
    )
    .join("");

  // 7. Restore code blocks
  s = s.replace(/__CODE_BLOCK_(\d+)__/g, (_m, idx: string) => codeBlocks[parseInt(idx, 10)]);

  return s;
}
