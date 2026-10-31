import React, { useState } from "react";
import {
  ExternalLink,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  Lightbulb,
  Info,
  Pin,
  Quote as QuoteIcon,
} from "lucide-react";

interface FormattedTextRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

// Color map for tags like [color=red]...[/color]
const COLOR_CLASSES: Record<string, string> = {
  red: "text-red-600 dark:text-red-400 font-bold",
  blue: "text-blue-600 dark:text-blue-400 font-bold",
  green: "text-emerald-600 dark:text-emerald-400 font-bold",
  emerald: "text-emerald-600 dark:text-emerald-400 font-bold",
  amber: "text-amber-600 dark:text-amber-400 font-bold",
  orange: "text-orange-600 dark:text-orange-400 font-bold",
  purple: "text-purple-600 dark:text-purple-400 font-bold",
  violet: "text-purple-600 dark:text-purple-400 font-bold",
  pink: "text-rose-600 dark:text-rose-400 font-bold",
  rose: "text-rose-600 dark:text-rose-400 font-bold",
  cyan: "text-cyan-600 dark:text-cyan-400 font-bold",
  sky: "text-sky-600 dark:text-sky-400 font-bold",
  gray: "text-gray-500 dark:text-gray-400 font-medium",
};

// Highlight marker background classes
const HIGHLIGHT_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-200/90 dark:bg-yellow-500/30 text-yellow-950 dark:text-yellow-100 px-1.5 py-0.5 rounded-md font-semibold",
  green: "bg-emerald-200/90 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 px-1.5 py-0.5 rounded-md font-semibold",
  cyan: "bg-cyan-200/90 dark:bg-cyan-500/30 text-cyan-950 dark:text-cyan-100 px-1.5 py-0.5 rounded-md font-semibold",
  pink: "bg-pink-200/90 dark:bg-pink-500/30 text-pink-950 dark:text-pink-100 px-1.5 py-0.5 rounded-md font-semibold",
  purple: "bg-purple-200/90 dark:bg-purple-500/30 text-purple-950 dark:text-purple-100 px-1.5 py-0.5 rounded-md font-semibold",
  orange: "bg-orange-200/90 dark:bg-orange-500/30 text-orange-950 dark:text-orange-100 px-1.5 py-0.5 rounded-md font-semibold",
};

// Interactive Telegram-style Spoiler Component
const TelegramSpoiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      className={`inline-flex items-center gap-1 cursor-pointer transition-all duration-300 rounded-lg px-2 py-0.5 select-none font-medium align-middle ${
        revealed
          ? "bg-primary/10 text-primary dark:text-blue-300 border border-primary/20"
          : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-transparent shadow-xs"
      }`}
      title={revealed ? "انقر للإخفاء مجدداً 🔒" : "نص مخفي (سبويلر تليغرام) - انقر للكشف 👁️"}
    >
      {!revealed ? (
        <span className="text-[10px] text-white flex items-center gap-1 font-bold pointer-events-none py-0.5">
          <Eye size={12} className="text-yellow-300" />
          <span>نص مخفي (انقر للكشف)</span>
        </span>
      ) : (
        <span className="inline">{children}</span>
      )}
    </span>
  );
};

export const FormattedTextRenderer: React.FC<FormattedTextRendererProps> = React.memo(({
  content,
  className = "",
  compact = false,
}) => {
  if (!content) return null;

  const htmlContainerRef = React.useRef<HTMLDivElement>(null);
  const isHtml = /<([a-z][a-z0-9]*)\b[^>]*>/i.test(content);

  React.useEffect(() => {
    const container = htmlContainerRef.current;
    if (!container) return;

    const handleSpoilerClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".telegram-spoiler");
      if (target) {
        target.classList.toggle("revealed");
      }
    };

    container.addEventListener("click", handleSpoilerClick);
    return () => container.removeEventListener("click", handleSpoilerClick);
  }, [content]);

  if (isHtml) {
    return (
      <div
        ref={htmlContainerRef}
        dir="auto"
        className={`formatted-html-renderer text-gray-800 dark:text-gray-100 leading-relaxed select-text space-y-2.5 ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Split content into blocks: Callouts, Quotes, Headers, Lists, Paragraphs
  const lines = content.split("\n");
  const blocks: {
    type: "quote" | "header" | "bullet" | "number" | "checklist" | "alert" | "tip" | "note" | "text";
    lines: string[];
    headerLevel?: number;
  }[] = [];

  let currentBlock: {
    type: "quote" | "header" | "bullet" | "number" | "checklist" | "alert" | "tip" | "note" | "text";
    lines: string[];
    headerLevel?: number;
  } | null = null;

  let inCallout: "alert" | "tip" | "note" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Callout opening / closing tags
    if (trimmed.startsWith("[alert]") || trimmed.startsWith("[warning]")) {
      inCallout = "alert";
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: "alert", lines: [rawLine.replace(/\[(alert|warning)\]/i, "")] };
      continue;
    }
    if (trimmed.startsWith("[tip]") || trimmed.startsWith("[idea]")) {
      inCallout = "tip";
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: "tip", lines: [rawLine.replace(/\[(tip|idea)\]/i, "")] };
      continue;
    }
    if (trimmed.startsWith("[note]") || trimmed.startsWith("[pin]")) {
      inCallout = "note";
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: "note", lines: [rawLine.replace(/\[(note|pin)\]/i, "")] };
      continue;
    }

    if (inCallout) {
      if (
        trimmed.includes("[/alert]") ||
        trimmed.includes("[/warning]") ||
        trimmed.includes("[/tip]") ||
        trimmed.includes("[/idea]") ||
        trimmed.includes("[/note]") ||
        trimmed.includes("[/pin]")
      ) {
        const cleaned = rawLine.replace(/\[\/(alert|warning|tip|idea|note|pin)\]/i, "");
        if (cleaned.trim()) {
          currentBlock?.lines.push(cleaned);
        }
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = null;
        inCallout = null;
        continue;
      }
      currentBlock?.lines.push(rawLine);
      continue;
    }

    // Header line detection (# H1, ## H2, ### H3)
    const isHeaderLine =
      trimmed.startsWith("# ") ||
      trimmed.startsWith("## ") ||
      trimmed.startsWith("### ") ||
      trimmed.startsWith("[h1]") ||
      trimmed.startsWith("[h2]");

    let headerLevel = 2;
    if (trimmed.startsWith("# ") || trimmed.startsWith("[h1]")) headerLevel = 1;
    else if (trimmed.startsWith("### ")) headerLevel = 3;

    // Quote line detection
    const isQuoteLine =
      trimmed.startsWith(">") ||
      trimmed.startsWith("»") ||
      trimmed.startsWith("[quote]") ||
      trimmed.endsWith("[/quote]");

    // Checklist line detection ([ ] or [x])
    const isChecklistLine = /^\[[ xX]\]\s/.test(trimmed);

    // Bullet line
    const isBulletLine =
      (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) &&
      !isChecklistLine;

    // Numbered line
    const isNumberLine = /^\d+[\.\-\)]\s/.test(trimmed);

    let detectedType: "quote" | "header" | "bullet" | "number" | "checklist" | "text" = "text";
    if (isHeaderLine) detectedType = "header";
    else if (isQuoteLine) detectedType = "quote";
    else if (isChecklistLine) detectedType = "checklist";
    else if (isBulletLine) detectedType = "bullet";
    else if (isNumberLine) detectedType = "number";

    if (!currentBlock || currentBlock.type !== detectedType || detectedType === "header") {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: detectedType, lines: [rawLine], headerLevel };
    } else {
      currentBlock.lines.push(rawLine);
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  // Helper to parse inline formatting tokens in a line
  const parseInline = (text: string): React.ReactNode => {
    // Tokens supported:
    // 1. Spoilers: ||text|| or [spoiler]text[/spoiler]
    // 2. Color tags: [color=name]text[/color]
    // 3. Highlight markers: [hl=name]text[/hl]
    // 4. Markdown links: [label](url)
    // 5. Bold: **text** or <b>text</b>
    // 6. Italic: *text* or <i>text</i> or _text_
    // 7. Underline: <u>text</u> or __text__
    // 8. Strikethrough: ~~text~~ or ~text~ or <s>text</s>
    // 9. Inline code: `text`
    // 10. Raw URLs: https://...
    const regex =
      /(\|\|[\s\S]*?\|\||\[spoiler\][\s\S]*?\[\/spoiler\]|\[color=[a-z]+\][\s\S]*?\[\/color\]|\[hl=[a-z]+\][\s\S]*?\[\/hl\]|\[[^\]]+\]\(https?:\/\/[^\)]+\)|\*\*[\s\S]*?\*\*|<b>[\s\S]*?<\/b>|\*[\s\S]*?\*|<i>[\s\S]*?<\/i>|__[\s\S]*?__|<u>[\s\S]*?<\/u>|~~[\s\S]*?~~|~[\s\S]*?~|<s>[\s\S]*?<\/s>|`[^`]+`|https?:\/\/[^\s<]+)/g;

    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // 1. Telegram Spoiler: ||secret|| or [spoiler]secret[/spoiler]
      if (
        (part.startsWith("||") && part.endsWith("||") && part.length >= 4) ||
        (part.startsWith("[spoiler]") && part.endsWith("[/spoiler]"))
      ) {
        const inner = part.startsWith("||") ? part.slice(2, -2) : part.slice(9, -10);
        return <TelegramSpoiler key={idx}>{parseInline(inner)}</TelegramSpoiler>;
      }

      // 2. Color tag: [color=red]...[/color]
      const colorMatch = part.match(/^\[color=([a-z]+)\]([\s\S]*?)\[\/color\]$/i);
      if (colorMatch) {
        const colorName = colorMatch[1].toLowerCase();
        const innerText = colorMatch[2];
        const colorClass = COLOR_CLASSES[colorName] || "text-primary font-bold";
        return (
          <span key={idx} className={colorClass}>
            {parseInline(innerText)}
          </span>
        );
      }

      // 3. Highlight tag: [hl=yellow]...[/hl]
      const hlMatch = part.match(/^\[hl=([a-z]+)\]([\s\S]*?)\[\/hl\]$/i);
      if (hlMatch) {
        const hlName = hlMatch[1].toLowerCase();
        const innerText = hlMatch[2];
        const hlClass = HIGHLIGHT_CLASSES[hlName] || HIGHLIGHT_CLASSES.yellow;
        return (
          <mark key={idx} className={hlClass}>
            {parseInline(innerText)}
          </mark>
        );
      }

      // 4. Markdown links: [title](url)
      const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
      if (mdLinkMatch) {
        const linkTitle = mdLinkMatch[1];
        const linkUrl = mdLinkMatch[2];
        return (
          <a
            key={idx}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1 mx-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{linkTitle}</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>
        );
      }

      // 5. Bold: **...** or <b>...</b>
      if (
        (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
        (part.startsWith("<b>") && part.endsWith("</b>"))
      ) {
        const inner = part.startsWith("**") ? part.slice(2, -2) : part.slice(3, -4);
        return (
          <strong key={idx} className="font-black text-gray-950 dark:text-white">
            {parseInline(inner)}
          </strong>
        );
      }

      // 6. Underline: <u>...</u> or __...__
      if (
        (part.startsWith("<u>") && part.endsWith("</u>")) ||
        (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
      ) {
        const inner = part.startsWith("<u>") ? part.slice(3, -4) : part.slice(2, -2);
        return (
          <span
            key={idx}
            className="underline decoration-2 decoration-primary/70 underline-offset-4 font-semibold"
          >
            {parseInline(inner)}
          </span>
        );
      }

      // 7. Strikethrough: ~~...~~ or ~...~ or <s>...</s>
      if (
        (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) ||
        (part.startsWith("~") && part.endsWith("~") && part.length >= 2) ||
        (part.startsWith("<s>") && part.endsWith("</s>"))
      ) {
        let inner = part;
        if (part.startsWith("~~")) inner = part.slice(2, -2);
        else if (part.startsWith("~")) inner = part.slice(1, -1);
        else inner = part.slice(3, -4);
        return (
          <del key={idx} className="line-through opacity-70 text-gray-500">
            {parseInline(inner)}
          </del>
        );
      }

      // 8. Inline code: `...`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={idx}
            className="bg-gray-100 dark:bg-slate-700/80 text-primary dark:text-blue-400 font-mono text-[11px] px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-600 inline-block font-bold mx-0.5"
          >
            {inner}
          </code>
        );
      }

      // 9. Italic: *...* or <i>...</i>
      if (
        (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
        (part.startsWith("<i>") && part.endsWith("</i>"))
      ) {
        const inner = part.startsWith("*") ? part.slice(1, -1) : part.slice(3, -4);
        return (
          <em key={idx} className="italic font-medium">
            {parseInline(inner)}
          </em>
        );
      }

      // 10. URL link: https://...
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary dark:text-blue-400 hover:underline font-bold break-all inline-flex items-center gap-0.5 mx-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{part}</span>
            <ExternalLink size={12} className="opacity-70 inline" />
          </a>
        );
      }

      return part;
    });
  };

  return (
    <div
      dir="auto"
      className={`text-gray-700 dark:text-gray-200 leading-relaxed space-y-2 select-text ${className}`}
    >
      {blocks.map((block, bIdx) => {
        // Headers (H1, H2, H3)
        if (block.type === "header") {
          const raw = block.lines.join("\n");
          const cleaned = raw
            .replace(/^#+\s*/, "")
            .replace(/^\[h[123]\]/, "")
            .replace(/\[\/h[123]\]$/, "");

          if (block.headerLevel === 1) {
            return (
              <h3
                key={bIdx}
                className={`font-black text-gray-950 dark:text-white pt-2 pb-0.5 border-b border-gray-200/60 dark:border-slate-700/60 ${
                  compact ? "text-base" : "text-lg md:text-xl"
                }`}
              >
                {parseInline(cleaned)}
              </h3>
            );
          }

          return (
            <h4
              key={bIdx}
              className={`font-black text-gray-900 dark:text-white pt-1.5 ${
                compact ? "text-xs md:text-sm" : "text-sm md:text-base"
              }`}
            >
              {parseInline(cleaned)}
            </h4>
          );
        }

        // Telegram-Style Quote Block
        if (block.type === "quote") {
          const cleanedLines = block.lines.map((l) =>
            l
              .replace(/^>\s*/, "")
              .replace(/^»\s*/, "")
              .replace(/^\[quote\]/, "")
              .replace(/\[\/quote\]$/, "")
          );
          return (
            <blockquote
              key={bIdx}
              className="border-r-4 rtl:border-r-4 ltr:border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-2xl p-3.5 my-2.5 text-xs md:text-sm text-gray-800 dark:text-gray-100 font-medium shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-black mb-1.5">
                <QuoteIcon size={14} className="fill-current" />
                <span>اقتباس / تنبيه مهم:</span>
              </div>
              <div className="space-y-1">
                {cleanedLines.map((line, lIdx) => (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(line)}
                  </p>
                ))}
              </div>
            </blockquote>
          );
        }

        // Alert Callout Box ([alert] / [warning])
        if (block.type === "alert") {
          return (
            <div
              key={bIdx}
              className="border-r-4 rtl:border-r-4 ltr:border-l-4 border-red-500 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-3.5 my-2.5 text-xs md:text-sm text-red-950 dark:text-red-200 shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-black mb-1">
                <AlertTriangle size={15} />
                <span>تنبيه عاجل ومهم ⚠️:</span>
              </div>
              <div className="space-y-1">
                {block.lines.map((l, lIdx) => (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(l)}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        // Tip Callout Box ([tip] / [idea])
        if (block.type === "tip") {
          return (
            <div
              key={bIdx}
              className="border-r-4 rtl:border-r-4 ltr:border-l-4 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl p-3.5 my-2.5 text-xs md:text-sm text-emerald-950 dark:text-emerald-200 shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-black mb-1">
                <Lightbulb size={15} />
                <span>فكرة وتوضيح ذهبي 💡:</span>
              </div>
              <div className="space-y-1">
                {block.lines.map((l, lIdx) => (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(l)}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        // Note Callout Box ([note] / [pin])
        if (block.type === "note") {
          return (
            <div
              key={bIdx}
              className="border-r-4 rtl:border-r-4 ltr:border-l-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-3.5 my-2.5 text-xs md:text-sm text-amber-950 dark:text-amber-200 shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-black mb-1">
                <Pin size={15} className="rotate-45" />
                <span>ملاحظة وتأشير الأستاذ 📌:</span>
              </div>
              <div className="space-y-1">
                {block.lines.map((l, lIdx) => (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInline(l)}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        // Checklist Block ([ ] or [x])
        if (block.type === "checklist") {
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 text-xs md:text-sm">
              {block.lines.map((line, lIdx) => {
                const isChecked = /^\[[xX]\]/.test(line.trim());
                const cleaned = line.trim().replace(/^\[[ xX]\]\s*/, "");
                return (
                  <li
                    key={lIdx}
                    className={`flex items-start gap-2.5 p-1 rounded-xl transition ${
                      isChecked ? "text-gray-400 dark:text-gray-500 line-through" : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square size={16} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </span>
                    <span className="flex-1 leading-relaxed">{parseInline(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Bullet List Block
        if (block.type === "bullet") {
          return (
            <ul key={bIdx} className="space-y-1.5 my-1.5 text-xs md:text-sm pr-1">
              {block.lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-•*]\s*/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="flex-1 leading-relaxed">{parseInline(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered List Block
        if (block.type === "number") {
          return (
            <ol key={bIdx} className="space-y-1.5 my-1.5 text-xs md:text-sm pr-1">
              {block.lines.map((line, lIdx) => {
                const match = line.match(/^(\d+)[\.\-\)]\s*(.*)$/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const text = match ? match[2] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="flex-1 leading-relaxed">{parseInline(text)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Standard Text Paragraph
        return (
          <div key={bIdx} className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
            {block.lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInline(line)}
                {lIdx < block.lines.length - 1 && "\n"}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
});

export default FormattedTextRenderer;
