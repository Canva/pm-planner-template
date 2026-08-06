"use client";

import { useRef } from "react";
import { Bold, Italic, TextQuote } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlackEditorProps {
  value: string;
  onChange: (v: string) => void;
  /** Minimum rows — auto-grows beyond this */
  minRows?: number;
  className?: string;
  placeholder?: string;
}

type FormatType = "bold" | "italic" | "quote";

/**
 * Textarea with a Slack-formatting toolbar.
 *
 * Slack syntax used:
 *   Bold       →  *text*
 *   Italic     →  _text_
 *   Blockquote →  > text   (one > per line, prepended to every selected line)
 */
export function SlackEditor({ value, onChange, minRows = 8, className, placeholder }: SlackEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyFormat(type: FormatType) {
    const el = ref.current;
    if (!el) return;

    const start    = el.selectionStart;
    const end      = el.selectionEnd;
    const selected = value.slice(start, end);

    let replacement: string;
    let cursorAfter: number; // cursor position when nothing was selected

    if (type === "bold") {
      replacement = selected ? `*${selected}*` : "**";
      cursorAfter = start + 1;
    } else if (type === "italic") {
      replacement = selected ? `_${selected}_` : "__";
      cursorAfter = start + 1;
    } else {
      // blockquote — prefix every selected line
      if (selected) {
        replacement = selected.split("\n").map((l) => `> ${l}`).join("\n");
      } else {
        // If cursor is at the start of the line, prefix the current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd   = value.indexOf("\n", start);
        const line      = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        const prefix    = `> ${line}`;
        const after     = lineEnd === -1 ? "" : value.slice(lineEnd);
        onChange(value.slice(0, lineStart) + prefix + after);
        setTimeout(() => {
          el.focus();
          const np = lineStart + 2;
          el.setSelectionRange(np, np);
        }, 0);
        return;
      }
      cursorAfter = start + 2;
    }

    const newValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(newValue);

    // Restore selection after React reconciles the textarea value
    setTimeout(() => {
      el.focus();
      if (selected) {
        el.setSelectionRange(start, start + replacement.length);
      } else {
        el.setSelectionRange(cursorAfter, cursorAfter);
      }
    }, 0);
  }

  const autoRows = Math.max(minRows, value.split("\n").length + 1);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border border-gray-200 border-b-0 rounded-t-lg">
        <ToolbarButton onClick={() => applyFormat("bold")} title="Bold  (*text*)">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyFormat("italic")} title="Italic  (_text_)">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => applyFormat("quote")} title="Block quote  (> text)">
          <TextQuote className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* Legend */}
        <span className="ml-auto text-[10px] text-gray-400 hidden sm:block select-none">
          Slack: <code className="font-mono">*bold*</code> &nbsp;
          <code className="font-mono">_italic_</code> &nbsp;
          <code className="font-mono">&gt; quote</code>
        </span>
      </div>

      {/* ── Textarea ── */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={autoRows}
        placeholder={placeholder}
        className="w-full font-mono text-sm text-gray-800 bg-white border border-gray-200 rounded-b-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent textarea from losing selection focus before we read it
        e.preventDefault();
        onClick();
      }}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  );
}
