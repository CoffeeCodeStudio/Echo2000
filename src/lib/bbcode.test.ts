import { describe, it, expect } from "vitest";
import { parseBBCode } from "./bbcode";

describe("parseBBCode", () => {
  describe("[code] blocks preserve literal content", () => {
    it("does not process [color] inside [code]", () => {
      const result = parseBBCode("[code][color=#FF0000]test[/color][/code]");
      expect(result).toContain("[color=#FF0000]test[/color]");
      expect(result).not.toContain('<span style="color:');
    });

    it("does not process [b], [i], [u], [s] inside [code]", () => {
      const result = parseBBCode("[code][b]bold[/b] [i]italic[/i][/code]");
      expect(result).toContain("[b]bold[/b]");
      expect(result).toContain("[i]italic[/i]");
      expect(result).not.toContain("<strong>");
      expect(result).not.toContain("<em>");
    });

    it("wraps [code] content in <pre>", () => {
      const result = parseBBCode("[code]hello[/code]");
      expect(result).toMatch(/^<pre[^>]*>hello<\/pre>$/);
    });

    it("preserves newlines inside [code] without adding <br>", () => {
      const result = parseBBCode("[code]line1\nline2[/code]");
      expect(result).toContain("line1\nline2");
      expect(result).not.toContain("line1<br>line2");
    });
  });

  describe("formatting tags outside [code]", () => {
    it("renders [b] as <strong>", () => {
      expect(parseBBCode("[b]bold[/b]")).toContain("<strong>bold</strong>");
    });

    it("renders [i] as <em>", () => {
      expect(parseBBCode("[i]italic[/i]")).toContain("<em>italic</em>");
    });

    it("renders [u] as <u>", () => {
      expect(parseBBCode("[u]underline[/u]")).toContain("<u>underline</u>");
    });

    it("renders [s] as <s>", () => {
      expect(parseBBCode("[s]struck[/s]")).toContain("<s>struck</s>");
    });

    it("renders [color=#HEX] as colored span", () => {
      const result = parseBBCode("[color=#FF0000]red[/color]");
      expect(result).toContain('<span style="color:#FF0000">red</span>');
    });

    it("renders [size=N] with clamped font-size", () => {
      expect(parseBBCode("[size=20]big[/size]")).toContain('font-size:20px');
      expect(parseBBCode("[size=5]tiny[/size]")).toContain('font-size:10px');
      expect(parseBBCode("[size=99]huge[/size]")).toContain('font-size:32px');
    });

    it("renders [center] as centered div", () => {
      expect(parseBBCode("[center]mid[/center]")).toContain('text-align:center');
    });
  });

  describe("mixed code and formatting", () => {
    it("formats outside [code] but not inside", () => {
      const result = parseBBCode("[b]bold[/b] then [code][b]literal[/b][/code]");
      expect(result).toContain("<strong>bold</strong>");
      expect(result).toContain("[b]literal[/b]");
    });
  });

  describe("newline handling", () => {
    it("converts newlines to <br> in normal text", () => {
      expect(parseBBCode("a\nb")).toContain("a<br>b");
    });
  });

  describe("pixel-art error", () => {
    it("shows warning for >500 [color] tags per line", () => {
      const line = Array(501).fill("[color=#FF0000]x[/color]").join("");
      const result = parseBBCode(line);
      expect(result).toContain("För många färgtaggar");
      expect(result).toContain("<strong>");
    });

    it("allows <=500 [color] tags per line", () => {
      const line = Array(500).fill("[color=#FF0000]x[/color]").join("");
      const result = parseBBCode(line);
      expect(result).not.toContain("För många färgtaggar");
      expect(result).toContain('<span style="color:#FF0000">');
    });
  });

  describe("XSS prevention", () => {
    it("escapes HTML tags", () => {
      const result = parseBBCode('<script>alert("xss")</script>');
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });
  });
});
