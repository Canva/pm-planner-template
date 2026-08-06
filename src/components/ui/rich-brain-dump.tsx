"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, List, ListOrdered, Heading2, Minus, Undo, Redo, X, CheckSquare,
} from "lucide-react";

const BRAIN_DUMP_KEY = "lc-brain-dump"; // legacy fallback only

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded text-sm transition-colors",
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// ── Rich Brain Dump ───────────────────────────────────────────────────────────
// Directly style task items via JS — tiptap v3 NodeView creates DOM elements
// dynamically so CSS !important doesn't always win. We use a MutationObserver
// to apply inline styles to every task item the moment it appears.
function styleTaskItem(li: Element) {
  const el = li as HTMLElement;

  // HTMLAttributes already applies the correct flex layout (flex-start).
  // This function only handles label + input sizing which CSS can't
  // target as reliably across TipTap v3 NodeView re-renders.
  const label = el.children[0] as HTMLElement | undefined;
  if (label) {
    label.style.flex = "0 0 auto";
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.justifyContent = "center";
    label.style.width = "0.875rem";
    label.style.height = "0.875rem";
    label.style.minWidth = "0.875rem";
    label.style.overflow = "hidden";
    label.style.margin = "0.15rem 0 0 0";  // nudge to align with text cap-height
    label.style.padding = "0";
    label.style.cursor = "pointer";

    const input = label.querySelector("input[type='checkbox']") as HTMLInputElement | null;
    if (input) {
      input.style.display = "block";
      input.style.width = "0.875rem";
      input.style.height = "0.875rem";
      input.style.maxWidth = "0.875rem";
      input.style.maxHeight = "0.875rem";
      input.style.margin = "0";
      input.style.padding = "0";
      input.style.cursor = "pointer";
    }
  }

  const contentDiv = el.children[1] as HTMLElement | undefined;
  if (contentDiv) {
    contentDiv.style.flex = "1 1 auto";
    contentDiv.style.minWidth = "0";
    contentDiv.style.margin = "0";
    const p = contentDiv.querySelector(":scope > p") as HTMLElement | null;
    if (p) { p.style.margin = "0"; p.style.lineHeight = "1.5"; }
  }
}

export function RichBrainDump({ onHide, userId, memberId }: { onHide?: () => void; userId?: string | null; memberId?: string | null } = {}) {
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // MutationObserver: style task items whenever they appear or are mutated
  useEffect(() => {
    const container = document.querySelector(".tiptap-brain-dump");
    if (!container) return;

    function applyAll() {
      container!.querySelectorAll("[data-type='taskItem']").forEach(styleTaskItem);
    }

    // Style items already in the DOM
    applyAll();

    const obs = new MutationObserver((mutations) => {
      let needsApply = false;
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const node of Array.from(m.addedNodes)) {
            if (!(node instanceof Element)) continue;
            if (node.matches("[data-type='taskItem']") ||
                node.querySelector("[data-type='taskItem']")) {
              needsApply = true;
              break;
            }
          }
        }
        // Re-apply when TipTap mutates attributes on existing items
        // (e.g. re-rendering a parent item after a sub-item is added)
        if (m.type === "attributes" &&
            m.target instanceof Element &&
            m.target.matches("[data-type='taskItem']")) {
          needsApply = true;
        }
        if (needsApply) break;
      }
      if (needsApply) applyAll();
    });

    obs.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-checked"],
    });
    return () => obs.disconnect();
  }, []);

  // Prefer userId (UserAccount) over memberId (TeamMember) for persistence.
  // userId is always available when logged in; memberId may be null if no team member is linked.
  const serverUrl = userId
    ? `/api/user/${userId}/brain-dump`
    : memberId
    ? `/api/team/${memberId}/brain-dump`
    : null;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TaskList.configure({
        HTMLAttributes: {
          style: "list-style:none;padding-left:0.25rem;margin:0.25rem 0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          // flex-start keeps the checkbox pinned to the top of the first
          // text line even when the item contains a nested sub-list below
          style: "display:flex;flex-direction:row;align-items:flex-start;gap:0.375rem;list-style:none;margin:0.1rem 0;padding:0",
        },
      }),
    ],
    content: "",
    editorProps: { attributes: { class: "tiptap" } },
    onUpdate({ editor }) {
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const json = JSON.stringify(editor.getJSON());
        if (serverUrl) {
          // Save to server (always preferred)
          try {
            await fetch(serverUrl, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: json }),
            });
          } catch {}
        } else {
          // Fallback: localStorage (unauthenticated)
          try { localStorage.setItem(BRAIN_DUMP_KEY, json); } catch {}
        }
        setSaved(true);
      }, 800);
    },
  });

  // Load content from server (by userId or memberId), else localStorage
  useEffect(() => {
    if (!editor) return;
    if (serverUrl) {
      fetch(serverUrl)
        .then((r) => r.json())
        .then(({ content }) => {
          if (!content) return;
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === "string") {
              editor.commands.setContent(`<p>${parsed.replace(/\n/g, "</p><p>")}</p>`);
            } else {
              editor.commands.setContent(parsed);
            }
          } catch {}
        })
        .catch(() => {});
    } else {
      // Legacy localStorage fallback (no account)
      try {
        const raw = localStorage.getItem(BRAIN_DUMP_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") {
          editor.commands.setContent(`<p>${parsed.replace(/\n/g, "</p><p>")}</p>`);
        } else {
          editor.commands.setContent(parsed);
        }
      } catch {}
    }
  }, [editor, serverUrl]);

  if (!editor) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Brain Dump</h3>
          <p className="text-xs text-gray-400 mt-0.5">Free-form scratchpad — just for you</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] transition-opacity", saved ? "text-gray-300" : "text-amber-400")}>
            {saved ? "Saved" : "Saving…"}
          </span>
          {onHide && (
            <button
              onClick={onHide}
              title="Hide Brain Dump"
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 flex-wrap">
        <ToolBtn
          title="Bold (⌘B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          title="Italic (⌘I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

        <ToolBtn
          title="Heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

        <ToolBtn
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          title="Task list"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

        <ToolBtn
          title="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

        <ToolBtn
          title="Undo (⌘Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn
          title="Redo (⌘⇧Z)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <div className="tiptap-brain-dump">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
