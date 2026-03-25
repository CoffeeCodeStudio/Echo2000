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

/** Validate and clamp a hex colour value. */
function sanitizeColor(raw: string): string | null {
  const match = raw.match(/^#?([0-9a-fA-F]{3,6})$/);
  if (!match) return null;
  return `#${match[1]}`;
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
 * - `[code]` (monospace / ASCII-art block)
 *
 * Newlines are converted to `<br>` (except inside `[code]` blocks where
 * they are preserved by the `<pre>` element).
 */
export function parseBBCode(input: string): string {
  // 1. Escape raw HTML
  let s = stripHtml(input);

  // 2. Handle [code]...[/code] FIRST so inner tags are left literal
  s = s.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    (_m, content: string) =>
      `<pre style="font-family:'Courier New',monospace;line-height:1.1;letter-spacing:0px;white-space:pre;overflow-x:auto;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;font-size:12px">${content}</pre>`
  );

  // 3. Simple tag pairs
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

  // 6. Newlines → <br> (skip inside <pre> blocks)
  s = s.replace(/((?:(?!<\/?pre[\s>])[\s\S])*)/gi, (segment) =>
    segment.replace(/\n/g, "<br>")
  );

  return s;
}
