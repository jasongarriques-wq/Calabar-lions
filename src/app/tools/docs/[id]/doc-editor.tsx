"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Editor } from "@tiptap/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  ArrowDownAZ,
  Bell,
  Bold,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardPaste,
  Clipboard,
  Copy as CopyIcon,
  Eraser,
  FileDown,
  Highlighter,
  Indent,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  Menu,
  Mic,
  MoreHorizontal,
  MousePointer,
  Outdent,
  PaintBucket,
  PaintRoller,
  Palette,
  Pilcrow,
  Plus,
  Printer,
  Redo2,
  Replace,
  Save,
  Scissors,
  Search,
  Send,
  Sheet,
  Sparkles,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableProperties,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave, type SaveStatus } from "@/lib/use-autosave";
import { SBA_CATEGORIES, SBA_SUBJECTS_BY_CODE } from "@/lib/sba-subjects";

export type DocCitation = { id: number; title: string; source?: string; url?: string };
export type Spreadsheet = { id: string; title: string };
export type SlideDeck = { id: string; title: string };
export type DocVersion = {
  id: string;
  title: string;
  body: string;
  note: string | null;
  created_at: string;
};
export type DocAuthorMeta = {
  name: string;
  form: string | null;
  classGroup: string | null;
  subject: string | null;
  academicYear: string | null;
  graduatingYear: number | null;
};

type Props = {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialCitations: DocCitation[];
  initialStatus: "draft" | "submitted" | "reviewed";
  initialSubject: string;
  linkedSpreadsheetId: string | null;
  linkedSlideDeckId: string | null;
  spreadsheets: Spreadsheet[];
  slideDecks: SlideDeck[];
  initialVersions: DocVersion[];
  author: DocAuthorMeta;
  canEdit: boolean;
};

const RIBBON_TABS = [
  "File",
  "Home",
  "Insert",
  "Draw",
  "Design",
  "Layout",
  "References",
  "Mailings",
  "Review",
  "View",
  "Help",
];

export function DocEditor(props: Props) {
  const [title, setTitle] = useState(props.initialTitle);
  const [body, setBody] = useState(props.initialBody);
  const [subject, setSubject] = useState(props.initialSubject);
  const [citations, setCitations] = useState<DocCitation[]>(props.initialCitations);
  const [status, setStatus] = useState(props.initialStatus);
  const [sheetId, setSheetId] = useState<string | null>(props.linkedSpreadsheetId);
  const [deckId, setDeckId] = useState<string | null>(props.linkedSlideDeckId);
  const [versions, setVersions] = useState<DocVersion[]>(props.initialVersions);
  const [tab, setTab] = useState<string>("Home");
  const [zoom, setZoom] = useState(100);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const skipNextSetContent = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: props.canEdit,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your document…" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noreferrer noopener" } }),
    ],
    content: body,
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none focus:outline-none text-[15px] leading-[1.65] text-slate-800 doc-canvas",
      },
    },
    onUpdate: ({ editor }) => setBody(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (skipNextSetContent.current) {
      skipNextSetContent.current = false;
      return;
    }
    if (editor.getHTML() === body) return;
    editor.commands.setContent(body, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const { status: saveStatus, error } = useAutosave(
    { title, body, subject, citations, sheetId, deckId },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({
          title: v.title,
          body: v.body,
          subject: v.subject || null,
          citations: v.citations,
          linked_spreadsheet_id: v.sheetId,
          linked_slide_deck_id: v.deckId,
        })
        .eq("id", props.id);
      if (error) throw new Error(error.message);
    },
    { enabled: props.canEdit },
  );

  const setBodyAndEditor = useCallback(
    (next: string) => {
      skipNextSetContent.current = true;
      setBody(next);
      if (editor) editor.commands.setContent(next, false);
    },
    [editor],
  );

  const stats = useMemo(() => computeStats(body), [body]);
  const outline = useMemo(() => parseOutline(body), [body]);
  const checks = useMemo(
    () => buildSbaChecks(body, citations.length, status),
    [body, citations.length, status],
  );
  const completion = useMemo(
    () => Math.round((checks.filter((c) => c.ok).length / checks.length) * 100),
    [checks],
  );

  async function saveNow() {
    if (!props.canEdit) return;
    const supabase = createClient();
    await supabase
      .from("documents")
      .update({
        title,
        body,
        subject: subject || null,
        citations,
        linked_spreadsheet_id: sheetId,
        linked_slide_deck_id: deckId,
      })
      .eq("id", props.id);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 print:h-auto print:bg-white">
      <TopBar
        title={title}
        setTitle={setTitle}
        saveStatus={saveStatus}
        canEdit={props.canEdit}
        author={props.author}
      />
      <RibbonTabs
        tab={tab}
        setTab={setTab}
        canEdit={props.canEdit}
        status={status}
        setStatus={setStatus}
        docId={props.id}
        title={title}
        body={body}
        citations={citations}
      />
      <Ribbon tab={tab} editor={editor} canEdit={props.canEdit} />

      <main className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
        {outlineOpen && (
          <OutlinePane
            outline={outline}
            checks={checks}
            completion={completion}
            close={() => setOutlineOpen(false)}
            onTemplate={(s) => {
              setBodyAndEditor(s.template ?? "");
              setSubject(s.name);
            }}
            canEdit={props.canEdit}
          />
        )}

        <section
          className={`relative flex min-h-0 flex-col overflow-hidden bg-[#c9cfdb] ${
            outlineOpen && assistantOpen
              ? "col-span-6"
              : outlineOpen || assistantOpen
                ? "col-span-9"
                : "col-span-12"
          }`}
        >
          <Ruler />
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4 print:overflow-visible print:bg-white print:p-0">
            <div
              className="mx-auto rounded-sm bg-white px-14 py-16 shadow-[0_6px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-300 print:max-w-none print:rounded-none print:shadow-none print:ring-0"
              style={{
                width: "min(100%, 1100px)",
                minHeight: 1500,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <CoverHeader
                title={title}
                setTitle={setTitle}
                author={props.author}
                subject={subject}
                setSubject={setSubject}
                canEdit={props.canEdit}
              />
              <div className="mt-8">
                {editor && <EditorContent editor={editor} />}
              </div>
              {citations.length > 0 && (
                <section className="prose prose-stone mt-10 max-w-none border-t border-slate-200 pt-6">
                  <h2>Bibliography</h2>
                  <ol>
                    {citations.map((c) => (
                      <li key={c.id}>
                        <strong>{c.title}</strong>
                        {c.source && ` — ${c.source}`}
                        {c.url && (
                          <>
                            {" — "}
                            <a href={c.url} target="_blank" rel="noreferrer">
                              {c.url}
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
          <FloatingFormatBar editor={editor} canEdit={props.canEdit} />
        </section>

        {assistantOpen && (
          <AssistantPane
            author={props.author}
            body={body}
            checks={checks}
            completion={completion}
            close={() => setAssistantOpen(false)}
            onCitation={() => insertCitationPrompt(editor, citations, setCitations)}
            docId={props.id}
            title={title}
            citations={citations}
            status={status}
            setStatus={setStatus}
            canEdit={props.canEdit}
            addSnapshot={async (note) => {
              const supabase = createClient();
              const { data: user } = await supabase.auth.getUser();
              const { data, error } = await supabase
                .from("document_versions")
                .insert({
                  document_id: props.id,
                  title,
                  body,
                  saved_by: user.user?.id ?? null,
                  note: note || null,
                })
                .select("id, title, body, note, created_at")
                .single();
              if (error) throw new Error(error.message);
              setVersions((prev) => [data as DocVersion, ...prev]);
            }}
            saveNow={saveNow}
            spreadsheets={props.spreadsheets}
            slideDecks={props.slideDecks}
            sheetId={sheetId}
            setSheetId={setSheetId}
            deckId={deckId}
            setDeckId={setDeckId}
            versions={versions}
            restoreVersion={(v) => setBodyAndEditor(v.body)}
          />
        )}
      </main>

      <StatusBar
        words={stats.words}
        zoom={zoom}
        setZoom={setZoom}
        toggleOutline={() => setOutlineOpen((v) => !v)}
        toggleAssistant={() => setAssistantOpen((v) => !v)}
      />
    </div>
  );
}

// ─── Top brand bar ────────────────────────────────────────────────────────

function TopBar({
  title,
  setTitle,
  saveStatus,
  canEdit,
  author,
}: {
  title: string;
  setTitle: (s: string) => void;
  saveStatus: SaveStatus;
  canEdit: boolean;
  author: DocAuthorMeta;
}) {
  const initials = author.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="flex h-14 items-center justify-between gap-4 bg-calabar-green-900 px-4 text-white print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-calabar-gold-500 text-base font-black text-calabar-green-900">
          L
        </div>
        <div className="leading-none">
          <p className="font-display text-base font-black tracking-wide">LION DOCS</p>
          <p className="mt-0.5 text-[10px] italic text-calabar-gold-200">
            Write like a Lion. Submit with pride.
          </p>
        </div>
        <div className="ml-3 hidden items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold sm:flex">
          SBA Document <ChevronDown className="h-3 w-3 opacity-70" />
        </div>
        <div className="ml-2 hidden gap-1 text-white/80 sm:flex">
          <button className="rounded p-1 hover:bg-white/10" aria-label="Undo">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button className="rounded p-1 hover:bg-white/10" aria-label="Redo">
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
          placeholder="Untitled document"
          className="min-w-0 max-w-md flex-1 bg-transparent text-center text-sm font-semibold tracking-tight outline-none placeholder:text-white/50 disabled:opacity-90"
        />
        <SaveBadge status={saveStatus} />
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded p-1.5 hover:bg-white/10" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative rounded p-1.5 hover:bg-white/10" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-calabar-gold-500 px-1 text-[9px] font-bold text-calabar-green-900">
            2
          </span>
        </button>
        <button className="rounded p-1.5 hover:bg-white/10" aria-label="Help">
          <Circle className="h-4 w-4" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-calabar-gold-500 text-[11px] font-black text-calabar-green-900">
            {initials}
          </div>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-xs font-semibold">{author.name}</p>
            <p className="text-[10px] text-white/70">
              {author.form ? `Form ${author.form}` : "Calabar"}
              {author.classGroup ? ` · ${author.classGroup}` : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "error"
        ? "Save failed"
        : status === "idle"
          ? "Saved"
          : "Saved";
  const cls =
    status === "error"
      ? "bg-red-500/30 text-red-100"
      : "bg-white/10 text-white/90";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
      <Check className="h-3 w-3" /> {label}
    </span>
  );
}

// ─── Ribbon tabs + actions ────────────────────────────────────────────────

function RibbonTabs({
  tab,
  setTab,
  canEdit,
  status,
  setStatus,
  docId,
  title,
  body,
  citations,
}: {
  tab: string;
  setTab: (t: string) => void;
  canEdit: boolean;
  status: "draft" | "submitted" | "reviewed";
  setStatus: (s: "draft" | "submitted" | "reviewed") => void;
  docId: string;
  title: string;
  body: string;
  citations: DocCitation[];
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!confirm("Submit this document for teacher review?")) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", docId);
    setPending(false);
    if (error) return alert(error.message);
    setStatus("submitted");
  }

  function exportPdf() {
    setExportOpen(false);
    window.print();
  }
  function exportDoc() {
    setExportOpen(false);
    const safe = (title || "document").replace(/[^\w\-]+/g, "_");
    const refs =
      citations.length > 0
        ? `<h2>Bibliography</h2><ol>${citations
            .map(
              (c) =>
                `<li><strong>${escapeHtml(c.title)}</strong>${c.source ? ` — ${escapeHtml(c.source)}` : ""}${
                  c.url ? ` — ${escapeHtml(c.url)}` : ""
                }</li>`,
            )
            .join("")}</ol>`
        : "";
    const html =
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>body{font-family:Calibri,Arial,sans-serif;line-height:1.5;margin:1in;}h1{font-size:24pt;}h2{font-size:18pt;}p{margin:8pt 0;}</style>` +
      `</head><body><h1>${escapeHtml(title)}</h1>${body}${refs}</body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white pl-3 pr-3 print:hidden">
      <nav className="flex items-end gap-1 overflow-x-auto">
        {RIBBON_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold transition ${
              tab === t
                ? "border-b-2 border-calabar-green-800 text-calabar-green-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-2 py-1.5">
        <button
          onClick={() =>
            document.querySelector<HTMLElement>("[data-comments-anchor]")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Sparkles className="h-3.5 w-3.5" /> Comments
        </button>
        <button
          onClick={() =>
            document.querySelector<HTMLElement>("[data-share-anchor]")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Users className="h-3.5 w-3.5" /> Share
        </button>
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-calabar-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-calabar-green-800"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
              <button onClick={exportPdf} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">
                Export as PDF
              </button>
              <button onClick={exportDoc} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">
                Export as Word
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={submit}
                disabled={!canEdit || status === "submitted" || pending}
                className="block w-full px-3 py-1.5 text-left text-calabar-green-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {status === "submitted"
                  ? "Already submitted"
                  : status === "reviewed"
                    ? "Resubmit for review"
                    : "Submit for review"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Word-style Ribbon (active tab content) ───────────────────────────────

function Ribbon({
  tab,
  editor,
  canEdit,
}: {
  tab: string;
  editor: Editor | null;
  canEdit: boolean;
}) {
  // We only implement the Home tab in detail; the others share a minimal toolbar.
  if (tab !== "Home" && tab !== "Insert") {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 print:hidden">
        {tab} tools coming soon.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-stretch gap-4 border-b border-slate-200 bg-slate-50 px-3 py-1.5 print:hidden">
      <RibbonGroup label="Clipboard">
        <BigBtn icon={ClipboardPaste} label="Paste" />
        <div className="flex flex-col gap-0.5">
          <MiniBtn icon={Scissors} label="Cut" />
          <MiniBtn icon={CopyIcon} label="Copy" />
          <MiniBtn icon={PaintRoller} label="Format Painter" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Font">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <select className="rounded border border-slate-300 bg-white px-2 py-1 text-xs" disabled={!canEdit}>
              <option>Calibri (Body)</option>
              <option>Aptos</option>
              <option>Times New Roman</option>
              <option>Arial</option>
              <option>Georgia</option>
            </select>
            <select className="rounded border border-slate-300 bg-white px-2 py-1 text-xs" disabled={!canEdit}>
              <option>11</option>
              <option>12</option>
              <option>14</option>
              <option>16</option>
              <option>18</option>
              <option>20</option>
              <option>24</option>
            </select>
            <RibbonIcon icon={Type} title="Grow font" disabled={!canEdit} />
            <RibbonIcon icon={Type} title="Shrink font" disabled={!canEdit} />
            <RibbonIcon icon={Eraser} title="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} disabled={!canEdit} />
          </div>
          <div className="flex items-center gap-1">
            <RibbonIcon icon={Bold} title="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!canEdit} />
            <RibbonIcon icon={Italic} title="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!canEdit} />
            <RibbonIcon icon={UnderlineIcon} title="Underline (uses code)" active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()} disabled={!canEdit} />
            <RibbonIcon icon={Strikethrough} title="Strike" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} disabled={!canEdit} />
            <RibbonIcon icon={Subscript} title="Subscript" disabled={!canEdit} />
            <RibbonIcon icon={Superscript} title="Superscript" disabled={!canEdit} />
            <RibbonIcon icon={Highlighter} title="Highlight" disabled={!canEdit} />
            <RibbonIcon icon={Palette} title="Font color" disabled={!canEdit} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <RibbonIcon icon={List} title="Bullets" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} disabled={!canEdit} />
            <RibbonIcon icon={ListOrdered} title="Numbering" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} disabled={!canEdit} />
            <RibbonIcon icon={ListChecks} title="Checklist" disabled={!canEdit} />
            <RibbonIcon icon={Outdent} title="Outdent" disabled={!canEdit} />
            <RibbonIcon icon={Indent} title="Indent" disabled={!canEdit} />
            <RibbonIcon icon={ArrowDownAZ} title="Sort" disabled={!canEdit} />
            <RibbonIcon icon={Pilcrow} title="Pilcrow" disabled={!canEdit} />
          </div>
          <div className="flex items-center gap-1">
            <RibbonIcon icon={AlignLeft} title="Align left" disabled={!canEdit} />
            <RibbonIcon icon={AlignCenter} title="Align center" disabled={!canEdit} />
            <RibbonIcon icon={AlignRight} title="Align right" disabled={!canEdit} />
            <RibbonIcon icon={AlignJustify} title="Justify" disabled={!canEdit} />
            <RibbonIcon icon={MoreHorizontal} title="Line spacing" disabled={!canEdit} />
            <RibbonIcon icon={PaintBucket} title="Shading" disabled={!canEdit} />
            <RibbonIcon icon={TableProperties} title="Borders" disabled={!canEdit} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Styles">
        <div className="flex items-center gap-1.5">
          <StyleSwatch label="Normal" active onClick={() => editor?.chain().focus().setParagraph().run()} />
          <StyleSwatch
            label="Heading 1"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor?.isActive("heading", { level: 1 })}
          />
          <StyleSwatch
            label="Heading 2"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive("heading", { level: 2 })}
          />
          <StyleSwatch
            label="Heading 3"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive("heading", { level: 3 })}
          />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Editing">
        <div className="flex flex-col gap-0.5">
          <MiniBtn icon={Search} label="Find" />
          <MiniBtn icon={Replace} label="Replace" />
          <MiniBtn icon={MousePointer} label="Select" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Voice">
        <BigBtn icon={Mic} label="Dictate" />
      </RibbonGroup>

      <RibbonGroup label="Insert">
        <div className="flex flex-col gap-0.5">
          <MiniBtn icon={Table} label="Table" />
          <MiniBtn
            icon={LinkIcon}
            label="Link"
            onClick={() => {
              if (!editor) return;
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", prev ?? "https://");
              if (url === null) return;
              if (url === "") return editor.chain().focus().unsetLink().run();
              editor.chain().focus().setLink({ href: url }).run();
            }}
          />
          <MiniBtn icon={Sheet} label="Sheet" />
        </div>
      </RibbonGroup>
    </div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch border-r border-slate-200 pr-3">
      <div className="flex flex-1 items-center gap-2">{children}</div>
      <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function RibbonIcon({
  icon: Icon,
  title,
  onClick,
  active,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-7 w-7 place-items-center rounded text-slate-700 transition disabled:opacity-40 ${
        active ? "bg-calabar-green-100 text-calabar-green-900" : "hover:bg-slate-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function BigBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-1 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px]">{label}</span>
      <ChevronDown className="h-3 w-3 opacity-60" />
    </button>
  );
}

function MiniBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200"
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function StyleSwatch({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 min-w-[88px] flex-col items-center justify-center rounded border px-2 text-[11px] transition ${
        active
          ? "border-calabar-green-500 bg-white text-calabar-green-900 ring-2 ring-calabar-green-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <span
        className={
          label === "Heading 1"
            ? "font-display text-base font-bold text-calabar-green-700"
            : label === "Heading 2"
              ? "font-display text-sm font-bold text-calabar-green-700"
              : label === "Heading 3"
                ? "font-display text-xs font-bold text-calabar-green-700"
                : "text-xs"
        }
      >
        Aa
      </span>
      <span className="mt-1 text-[10px] text-slate-600">{label}</span>
    </button>
  );
}

// ─── Ruler ────────────────────────────────────────────────────────────────

function Ruler() {
  return (
    <div className="border-b border-slate-300 bg-white px-4 py-1 print:hidden">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between text-[10px] text-slate-400">
        {Array.from({ length: 17 }).map((_, i) => (
          <span key={i}>{i - 1}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Cover header (the document) ──────────────────────────────────────────

function CoverHeader({
  title,
  setTitle,
  author,
  subject,
  setSubject,
  canEdit,
}: {
  title: string;
  setTitle: (s: string) => void;
  author: DocAuthorMeta;
  subject: string;
  setSubject: (s: string) => void;
  canEdit: boolean;
}) {
  return (
    <header>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={!canEdit}
        placeholder="Untitled SBA"
        className="w-full bg-transparent text-center font-display text-2xl font-bold focus:outline-none disabled:opacity-90"
      />
      <div className="mt-6 text-sm leading-7 text-slate-700">
        <p>
          <strong>By:</strong> {author.name}
        </p>
        {author.form && (
          <p>
            <strong>Form:</strong> {author.form}
            {author.classGroup ? ` · ${author.classGroup}` : ""}
          </p>
        )}
        <p className="flex items-center gap-2">
          <strong>Subject:</strong>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={!canEdit}
            placeholder="e.g. Social Studies"
            className="flex-1 bg-transparent focus:outline-none disabled:opacity-90"
          />
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date().toLocaleDateString("en-JM", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </header>
  );
}

// ─── Outline (left) ───────────────────────────────────────────────────────

function OutlinePane({
  outline,
  checks,
  completion,
  close,
  onTemplate,
  canEdit,
}: {
  outline: { title: string; filled: boolean }[];
  checks: { ok: boolean }[];
  completion: number;
  close: () => void;
  onTemplate: (s: { name: string; template?: string }) => void;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<"outline" | "pages">("outline");
  const [code, setCode] = useState("");
  const subject = code ? SBA_SUBJECTS_BY_CODE[code] : undefined;
  return (
    <aside className="col-span-3 flex min-h-0 flex-col border-r border-slate-200 bg-white text-slate-900 print:hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outline</h2>
        <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Close outline">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2 text-xs font-semibold">
        <button
          onClick={() => setTab("outline")}
          className={
            tab === "outline"
              ? "border-b-2 border-calabar-green-700 pb-1 text-calabar-green-900"
              : "pb-1 text-slate-500 hover:text-slate-900"
          }
        >
          SBA Outline
        </button>
        <button
          onClick={() => setTab("pages")}
          className={
            tab === "pages"
              ? "border-b-2 border-calabar-green-700 pb-1 text-calabar-green-900"
              : "pb-1 text-slate-500 hover:text-slate-900"
          }
        >
          Pages
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {tab === "outline" && (
          <ul className="space-y-0.5">
            {outline.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-slate-500">
                Use Heading 2 in the document to populate the outline.
              </li>
            )}
            {outline.map((s, i) => (
              <li key={i}>
                <button className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-100">
                  <span className="truncate">📄 {s.title}</span>
                  {s.filled ? (
                    <CheckCircle2 className="h-4 w-4 flex-none text-calabar-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 flex-none text-slate-300" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {tab === "pages" && (
          <p className="px-2 py-1.5 text-xs text-slate-500">
            Multi-page navigation is coming with print pagination.
          </p>
        )}

        <div className="mx-2 mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            SBA Templates
          </p>
          <select
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!canEdit}
            className="mt-2 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
          >
            <option value="">Pick a subject…</option>
            {SBA_CATEGORIES.map((cat) => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} · {s.track.toUpperCase()}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!subject?.template) return;
              if (!confirm(`Replace document body with the ${subject.name} template?`)) return;
              onTemplate(subject);
            }}
            disabled={!subject?.template || !canEdit}
            className="mt-2 w-full rounded-md bg-calabar-green-700 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-calabar-green-800 disabled:opacity-50"
          >
            Apply template
          </button>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold">SBA Checker</span>
          <span>{completion}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-calabar-green-600"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {checks.filter((c) => c.ok).length} of {checks.length} sections complete
        </p>
      </div>
    </aside>
  );
}

// ─── Assistant (right) ────────────────────────────────────────────────────

function AssistantPane({
  author,
  body,
  checks,
  completion,
  close,
  onCitation,
  docId,
  title,
  citations,
  status,
  setStatus,
  canEdit,
  addSnapshot,
  saveNow,
  spreadsheets,
  slideDecks,
  sheetId,
  setSheetId,
  deckId,
  setDeckId,
  versions,
  restoreVersion,
}: {
  author: DocAuthorMeta;
  body: string;
  checks: Array<{ label: string; ok: boolean; hint: string }>;
  completion: number;
  close: () => void;
  onCitation: () => void;
  docId: string;
  title: string;
  citations: DocCitation[];
  status: "draft" | "submitted" | "reviewed";
  setStatus: (s: "draft" | "submitted" | "reviewed") => void;
  canEdit: boolean;
  addSnapshot: (note: string) => Promise<void>;
  saveNow: () => Promise<void>;
  spreadsheets: Spreadsheet[];
  slideDecks: SlideDeck[];
  sheetId: string | null;
  setSheetId: (id: string | null) => void;
  deckId: string | null;
  setDeckId: (id: string | null) => void;
  versions: DocVersion[];
  restoreVersion: (v: DocVersion) => void;
}) {
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const first = author.name.split(" ")[0] || "Lion";
  const passing = checks.filter((c) => c.ok).length;

  async function ask(action: "improve" | "check" | "formal" | "thesis" | "biblio" | "grammar") {
    setPending(true);
    setResponse(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, body }),
      });
      const json = await res.json();
      setResponse(json.text ?? "No response.");
    } catch {
      setResponse(
        "AI assistant isn't configured yet. Add ANTHROPIC_API_KEY to Vercel env vars to enable.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="col-span-3 flex min-h-0 flex-col border-l border-slate-200 bg-white text-slate-900 print:hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Lion Assistant
        </h2>
        <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Close assistant">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="text-base font-semibold">
          Hi {first}! <span className="ml-0.5">👋</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          How can I help improve your writing?
        </p>

        <div className="mt-3 space-y-1.5">
          <AsstBtn icon={Sparkles} label="Improve this paragraph" onClick={() => ask("improve")} pending={pending} />
          <AsstBtn icon={Type} label="Check grammar & spelling" onClick={() => ask("grammar")} pending={pending} />
          <AsstBtn icon={Send} label="Strengthen my thesis" onClick={() => ask("thesis")} pending={pending} />
          <AsstBtn icon={LinkIcon} label="Generate bibliography" onClick={() => ask("biblio")} pending={pending} />
          <AsstBtn icon={CheckCircle2} label="Check SBA requirements" onClick={() => ask("check")} pending={pending} />
          <AsstBtn icon={Pilcrow} label="Make writing more formal" onClick={() => ask("formal")} pending={pending} />
          <AsstBtn icon={Plus} label="Insert citation" onClick={onCitation} />
        </div>

        {response && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            {response}
          </div>
        )}

        {/* SBA Checker */}
        <div data-comments-anchor className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SBA Checker</p>
          <div className="mt-3 flex items-center gap-4">
            <CircleProgress percent={completion} />
            <div>
              <p className="text-sm font-semibold text-calabar-green-800">Good progress!</p>
              <p className="text-[11px] text-slate-500">{passing} of {checks.length} complete</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-xs">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between">
                <span className={c.ok ? "text-slate-700" : "text-slate-500"}>{c.label}</span>
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-calabar-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-amber-500" />
                )}
              </li>
            ))}
          </ul>
          {checks.some((c) => !c.ok) && (
            <p className="mt-3 text-[11px] font-semibold text-calabar-gold-700">
              {checks.filter((c) => !c.ok).length} section{checks.filter((c) => !c.ok).length === 1 ? "" : "s"} need attention
            </p>
          )}
        </div>

        {/* Inline panel — sharing + comments anchors */}
        <div data-share-anchor className="mt-6 space-y-3">
          <SnapshotMini canEdit={canEdit} addSnapshot={addSnapshot} />
          <AttachInline
            sheetId={sheetId}
            setSheetId={setSheetId}
            deckId={deckId}
            setDeckId={setDeckId}
            spreadsheets={spreadsheets}
            slideDecks={slideDecks}
            canEdit={canEdit}
          />
          <VersionsInline versions={versions} restore={restoreVersion} canRestore={canEdit} />
          <SubmitInline
            status={status}
            setStatus={setStatus}
            docId={docId}
            canEdit={canEdit}
            saveNow={saveNow}
          />
        </div>
      </div>
    </aside>
  );
}

function AsstBtn({
  icon: Icon,
  label,
  onClick,
  pending,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 transition hover:border-calabar-green-300 hover:bg-calabar-green-50 disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5 flex-none text-calabar-green-700" />
      {label}
    </button>
  );
}

function CircleProgress({ percent }: { percent: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 60 60" className="h-14 w-14">
        <circle cx="30" cy="30" r={r} stroke="#e2e8f0" strokeWidth="6" fill="none" />
        <circle
          cx="30"
          cy="30"
          r={r}
          stroke="#137c3d"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-900">
        {percent}%
      </div>
    </div>
  );
}

function SnapshotMini({
  canEdit,
  addSnapshot,
}: {
  canEdit: boolean;
  addSnapshot: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Save version</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={!canEdit}
        placeholder="Snapshot note (optional)"
        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs"
      />
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await addSnapshot(note);
            setNote("");
          })
        }
        disabled={!canEdit}
        className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 disabled:opacity-50"
      >
        <Save className="h-3 w-3" />
        Save version
      </button>
    </div>
  );
}

function AttachInline({
  sheetId,
  setSheetId,
  deckId,
  setDeckId,
  spreadsheets,
  slideDecks,
  canEdit,
}: {
  sheetId: string | null;
  setSheetId: (id: string | null) => void;
  deckId: string | null;
  setDeckId: (id: string | null) => void;
  spreadsheets: Spreadsheet[];
  slideDecks: SlideDeck[];
  canEdit: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Linked artefacts</p>
      <label className="mt-2 block text-[11px] text-slate-600">Spreadsheet</label>
      <select
        value={sheetId ?? ""}
        onChange={(e) => setSheetId(e.target.value || null)}
        disabled={!canEdit}
        className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
      >
        <option value="">None</option>
        {spreadsheets.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>
      {sheetId && (
        <a href={`/tools/sheets/${sheetId}`} className="mt-1 block text-[11px] text-calabar-green-700 hover:underline">
          Open linked sheet →
        </a>
      )}
      <label className="mt-2 block text-[11px] text-slate-600">Slide deck</label>
      <select
        value={deckId ?? ""}
        onChange={(e) => setDeckId(e.target.value || null)}
        disabled={!canEdit}
        className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
      >
        <option value="">None</option>
        {slideDecks.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>
      {deckId && (
        <a href={`/tools/slides/${deckId}`} className="mt-1 block text-[11px] text-calabar-green-700 hover:underline">
          Open linked deck →
        </a>
      )}
    </div>
  );
}

function VersionsInline({
  versions,
  restore,
  canRestore,
}: {
  versions: DocVersion[];
  restore: (v: DocVersion) => void;
  canRestore: boolean;
}) {
  if (versions.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recent versions</p>
      <ul className="mt-2 space-y-1.5 text-xs">
        {versions.slice(0, 5).map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-2">
            <span className="truncate text-slate-700">
              {new Date(v.created_at).toLocaleDateString()}
              {v.note ? ` — ${v.note}` : ""}
            </span>
            {canRestore && (
              <button
                onClick={() => restore(v)}
                className="text-[11px] font-semibold text-calabar-green-700 hover:underline"
              >
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubmitInline({
  status,
  setStatus,
  docId,
  canEdit,
  saveNow,
}: {
  status: "draft" | "submitted" | "reviewed";
  setStatus: (s: "draft" | "submitted" | "reviewed") => void;
  docId: string;
  canEdit: boolean;
  saveNow: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  async function submit() {
    if (!confirm("Submit this document for teacher review?")) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", docId);
    setPending(false);
    if (error) return alert(error.message);
    setStatus("submitted");
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submission</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => void saveNow()}
          disabled={!canEdit}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <Save className="h-3 w-3" /> Save now
        </button>
        <button
          onClick={submit}
          disabled={!canEdit || pending || status === "submitted"}
          className="inline-flex items-center gap-1 rounded-md bg-calabar-green-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-calabar-green-800 disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> {status === "submitted" ? "Sent" : "Submit"}
        </button>
      </div>
    </div>
  );
}

// ─── Floating format bar (bottom of canvas) ──────────────────────────────

function FloatingFormatBar({ editor, canEdit }: { editor: Editor | null; canEdit: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center print:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-lg">
        <select className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px]" disabled={!canEdit}>
          <option>Calibri (Body)</option>
        </select>
        <select className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px]" disabled={!canEdit}>
          <option>11</option>
        </select>
        <RibbonIcon icon={Bold} title="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!canEdit} />
        <RibbonIcon icon={Italic} title="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!canEdit} />
        <RibbonIcon icon={UnderlineIcon} title="Code" active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()} disabled={!canEdit} />
        <RibbonIcon icon={Highlighter} title="Highlight" disabled={!canEdit} />
        <RibbonIcon icon={Palette} title="Color" disabled={!canEdit} />
        <RibbonIcon icon={List} title="Bullets" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} disabled={!canEdit} />
        <RibbonIcon icon={Indent} title="Indent" disabled={!canEdit} />
        <RibbonIcon icon={MoreHorizontal} title="More" />
      </div>
    </div>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────

function StatusBar({
  words,
  zoom,
  setZoom,
  toggleOutline,
  toggleAssistant,
}: {
  words: number;
  zoom: number;
  setZoom: (n: number) => void;
  toggleOutline: () => void;
  toggleAssistant: () => void;
}) {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-1.5 text-[11px] text-slate-600 print:hidden">
      <div className="flex items-center gap-4">
        <button onClick={toggleOutline} className="inline-flex items-center gap-1 hover:text-slate-900" title="Toggle outline">
          <Menu className="h-3.5 w-3.5" /> Outline
        </button>
        <span>Page 1</span>
        <span>{words.toLocaleString()} words</span>
        <Clipboard className="hidden h-3.5 w-3.5 sm:block" />
        <span className="hidden sm:inline">English (Jamaica)</span>
        <span className="hidden md:inline">Text Predictions: On</span>
        <span className="hidden lg:inline">Accessibility: Good to go</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleAssistant} className="inline-flex items-center gap-1 hover:text-slate-900" title="Toggle assistant">
          <Sparkles className="h-3.5 w-3.5" /> Assistant
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(Math.max(60, zoom - 10))} className="rounded px-1.5 hover:bg-slate-100">−</button>
          <input
            type="range"
            min={60}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24"
          />
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="rounded px-1.5 hover:bg-slate-100">+</button>
          <span className="ml-1 w-9 text-right">{zoom}%</span>
        </div>
        <Maximize2 className="h-3.5 w-3.5" />
      </div>
    </footer>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseOutline(body: string) {
  const sections: { title: string; filled: boolean }[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const heading = m[1].replace(/<[^>]*>/g, "").trim();
    if (!heading) continue;
    const after = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({ title: heading, filled: after.length >= 80 });
  }
  return sections;
}

function computeStats(body: string) {
  const plain = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plain ? plain.split(" ").length : 0;
  const chars = plain.length;
  const sentences = plain ? plain.split(/[.!?]+\s+/).filter(Boolean).length : 0;
  const paragraphs =
    body
      .split(/<\/p>|<\/h[1-6]>|<\/li>/)
      .map((s) => s.replace(/<[^>]*>/g, "").trim())
      .filter(Boolean).length || (plain ? 1 : 0);
  const avgWordsPerSentence =
    sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;
  const readingMinutes = Math.max(1, Math.round(words / 200));

  const tips: string[] = [];
  if (words < 50) tips.push("Add at least one detailed paragraph to get going.");
  if (avgWordsPerSentence > 28)
    tips.push("Sentences are long. Aim for under 25 words on average.");
  if (sentences > 0 && paragraphs <= 1 && words > 200)
    tips.push("Break the text into multiple paragraphs.");
  if (/\bthing\b/i.test(plain))
    tips.push("Replace ‘thing’ with a more specific noun.");
  if (/\b(can't|won't|don't|it's|I'm|you're|they're|we're)\b/.test(plain))
    tips.push("Avoid contractions in formal writing.");
  return { words, chars, sentences, paragraphs, avgWordsPerSentence, readingMinutes, tips };
}

function buildSbaChecks(body: string, citationCount: number, status: string) {
  const plain = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plain ? plain.split(" ").length : 0;
  const headings = Array.from(body.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)).map((m) =>
    m[1].toLowerCase(),
  );
  const has = (needles: string[]) =>
    headings.some((h) => needles.some((n) => h.includes(n)));
  return [
    { label: "Cover Page", ok: words > 0, hint: "Give the document a clear title." },
    { label: "Table of Contents", ok: headings.length >= 3, hint: "Add at least three H2 sections." },
    { label: "Introduction", ok: has(["introduction", "aim", "purpose", "background"]), hint: "Add an Introduction." },
    { label: "Research Question", ok: has(["research question", "question"]), hint: "Add a Research Question heading." },
    { label: "Aim / Purpose", ok: has(["aim", "purpose"]), hint: "Add an Aim or Purpose heading." },
    { label: "Methodology", ok: has(["method", "procedure", "design"]), hint: "Add a Methodology heading." },
    { label: "Data Collection", ok: has(["data collection", "data"]), hint: "Add a Data Collection heading." },
    { label: "Analysis", ok: has(["analysis", "findings", "discussion"]), hint: "Add an Analysis heading." },
    { label: "Findings", ok: has(["findings", "results"]), hint: "Add a Findings heading." },
    { label: "Conclusion", ok: has(["conclusion"]), hint: "Add a Conclusion heading." },
    { label: "Recommendations", ok: has(["recommendation"]), hint: "Add Recommendations." },
    { label: "Bibliography", ok: citationCount > 0 || has(["bibliography", "references"]), hint: "Insert citations or add a Bibliography heading." },
    { label: "Word count (≥800)", ok: words >= 800, hint: `Currently ${words} words.` },
    { label: "Submitted", ok: status !== "draft", hint: "Submit when ready." },
  ];
}

function insertCitationPrompt(
  editor: Editor | null,
  citations: DocCitation[],
  setCitations: React.Dispatch<React.SetStateAction<DocCitation[]>>,
) {
  const title = window.prompt("Citation title / reference");
  if (!title) return;
  const source = window.prompt("Author / source (optional)") ?? "";
  const url = window.prompt("URL (optional)") ?? "";
  const next: DocCitation = {
    id: (citations.at(-1)?.id ?? 0) + 1,
    title,
    source: source || undefined,
    url: url || undefined,
  };
  setCitations((prev) => [...prev, next]);
  if (editor) editor.chain().focus().insertContent(` [${next.id}]`).run();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
