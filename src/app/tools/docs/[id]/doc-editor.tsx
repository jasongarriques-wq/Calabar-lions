"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Editor } from "@tiptap/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  BookText,
  ClipboardList,
  Download,
  History,
  ListChecks,
  Paperclip,
  Quote,
  Send,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";
import { SBA_CATEGORIES, SBA_SUBJECTS_BY_CODE } from "@/lib/sba-subjects";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Strikethrough,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Code,
} from "lucide-react";

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

export function DocEditor(props: Props) {
  const [title, setTitle] = useState(props.initialTitle);
  const [body, setBody] = useState(props.initialBody);
  const [subject, setSubject] = useState(props.initialSubject);
  const [citations, setCitations] = useState<DocCitation[]>(props.initialCitations);
  const [status, setStatus] = useState(props.initialStatus);
  const [sheetId, setSheetId] = useState<string | null>(props.linkedSpreadsheetId);
  const [deckId, setDeckId] = useState<string | null>(props.linkedSlideDeckId);
  const [versions, setVersions] = useState<DocVersion[]>(props.initialVersions);
  const skipNextSetContent = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: props.canEdit,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your document…" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noreferrer noopener" } }),
    ],
    content: body,
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none focus:outline-none min-h-[60vh] text-base leading-relaxed",
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <article className="doc-print">
        <AuthorHeader author={props.author} subject={subject} />
        <div className="flex items-center justify-between gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!props.canEdit}
            placeholder="Document title"
            className="w-full bg-transparent font-display text-3xl font-bold focus:outline-none disabled:opacity-80"
          />
          <SaveStatusPill status={saveStatus} error={error} />
        </div>
        <DocMeta status={status} body={body} />
        {editor && (
          <>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            {citations.length > 0 && <Bibliography citations={citations} />}
          </>
        )}
      </article>

      <DocSidePanel
        id={props.id}
        title={title}
        body={body}
        subject={subject}
        setSubject={setSubject}
        editor={editor}
        citations={citations}
        setCitations={setCitations}
        status={status}
        setStatus={setStatus}
        setBody={(next) => {
          skipNextSetContent.current = true;
          setBody(next);
          if (editor) editor.commands.setContent(next, false);
        }}
        sheetId={sheetId}
        setSheetId={setSheetId}
        deckId={deckId}
        setDeckId={setDeckId}
        spreadsheets={props.spreadsheets}
        slideDecks={props.slideDecks}
        versions={versions}
        setVersions={setVersions}
        canEdit={props.canEdit}
      />
    </div>
  );
}

function AuthorHeader({
  author,
  subject,
}: {
  author: DocAuthorMeta;
  subject: string;
}) {
  const initials = author.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 print:border-0 print:bg-transparent print:px-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-calabar-green-700 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="flex-1 text-xs text-stone-600">
          <p className="text-sm font-semibold text-stone-900">{author.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {author.classGroup && <span>Class {author.classGroup}</span>}
            {author.form && <span>· Form {author.form}</span>}
            {subject && <span>· {subject}</span>}
            {author.academicYear && <span>· {author.academicYear}</span>}
            {author.graduatingYear && <span>· Grad {author.graduatingYear}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocMeta({ status, body }: { status: string; body: string }) {
  const plain = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plain ? plain.split(" ").length : 0;
  const chars = plain.length;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
      <span>{words} words</span>
      <span>·</span>
      <span>{chars} characters</span>
      <span>·</span>
      <span className={`pill ${statusClass(status)}`}>{statusLabel(status)}</span>
    </div>
  );
}

function statusClass(s: string) {
  if (s === "submitted") return "bg-calabar-gold-100 text-calabar-gold-800";
  if (s === "reviewed") return "bg-calabar-green-50 text-calabar-green-800";
  return "bg-stone-100 text-stone-700";
}
function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Bibliography({ citations }: { citations: DocCitation[] }) {
  return (
    <section className="prose prose-stone mt-10 max-w-none border-t border-stone-200 pt-6">
      <h2>Bibliography</h2>
      <ol>
        {citations.map((c) => (
          <li key={c.id}>
            <strong>{c.title}</strong>
            {c.source && ` — ${c.source}`}
            {c.url && (
              <>
                {" — "}
                <a href={c.url} target="_blank" rel="noreferrer">{c.url}</a>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

// -- Toolbar (shared with rich-text-editor; duplicated here for editor-coupled controls) --

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="sticky top-0 z-10 -mx-2 my-4 flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-white/95 px-2 py-1.5 backdrop-blur print:hidden">
      <TbBtn icon={Heading2} title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <TbBtn icon={Heading3} title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <TbBtn icon={Bold} title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <TbBtn icon={Italic} title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <TbBtn icon={Strikethrough} title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <TbBtn icon={Code} title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
      <Divider />
      <TbBtn icon={List} title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <TbBtn icon={ListOrdered} title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <TbBtn icon={Quote} title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <TbBtn icon={LinkIcon} title="Add link" active={editor.isActive("link")} onClick={() => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL", previous ?? "https://");
        if (url === null) return;
        if (url === "") return editor.chain().focus().unsetLink().run();
        editor.chain().focus().setLink({ href: url }).run();
      }} />
      <Divider />
      <TbBtn icon={Undo2} title="Undo" onClick={() => editor.chain().focus().undo().run()} />
      <TbBtn icon={Redo2} title="Redo" onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}

function TbBtn({ icon: Icon, title, onClick, active }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`grid h-8 w-8 place-items-center rounded-lg text-stone-700 transition ${
        active ? "bg-calabar-green-100 text-calabar-green-900" : "hover:bg-stone-100"
      }`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-stone-200" />;
}

// -- Side panel --

type PanelProps = {
  id: string;
  title: string;
  body: string;
  subject: string;
  setSubject: (s: string) => void;
  editor: Editor | null;
  citations: DocCitation[];
  setCitations: React.Dispatch<React.SetStateAction<DocCitation[]>>;
  status: "draft" | "submitted" | "reviewed";
  setStatus: (s: "draft" | "submitted" | "reviewed") => void;
  setBody: (b: string) => void;
  sheetId: string | null;
  setSheetId: (id: string | null) => void;
  deckId: string | null;
  setDeckId: (id: string | null) => void;
  spreadsheets: Spreadsheet[];
  slideDecks: SlideDeck[];
  versions: DocVersion[];
  setVersions: React.Dispatch<React.SetStateAction<DocVersion[]>>;
  canEdit: boolean;
};

function DocSidePanel(p: PanelProps) {
  return (
    <aside className="space-y-4 print:hidden">
      <TemplateSection {...p} />
      <OutlineSection body={p.body} />
      <SbaCheckerSection {...p} />
      <StatsSection body={p.body} />
      <CitationsSection {...p} />
      <AttachSection {...p} />
      <VersionsSection {...p} />
      <ActionsSection {...p} />
    </aside>
  );
}

function PanelCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-calabar-green-700" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  );
}

function TemplateSection({ setBody, setSubject, canEdit }: PanelProps) {
  const [code, setCode] = useState("");
  const subject = code ? SBA_SUBJECTS_BY_CODE[code] : undefined;

  function apply() {
    if (!subject?.template) return;
    if (!confirm(`Replace document body with the ${subject.name} SBA template?`)) return;
    setBody(subject.template);
    setSubject(subject.name);
  }

  return (
    <PanelCard icon={BookText} title="SBA template">
      <select
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="input"
        disabled={!canEdit}
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
      {subject && (
        <p className="mt-2 text-xs text-stone-500">{subject.sbaType}</p>
      )}
      <button
        type="button"
        onClick={apply}
        disabled={!subject?.template || !canEdit}
        className="btn-primary mt-3 w-full justify-center text-xs disabled:opacity-60"
      >
        Apply template
      </button>
    </PanelCard>
  );
}

function OutlineSection({ body }: { body: string }) {
  const sections = useMemo(() => parseOutline(body), [body]);
  const done = sections.filter((s) => s.filled).length;
  return (
    <PanelCard icon={ListChecks} title="SBA outline">
      {sections.length === 0 ? (
        <p className="text-xs text-stone-500">No headings yet. Use H2 to define sections.</p>
      ) : (
        <>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-calabar-green-600 transition-all"
              style={{ width: `${(done / sections.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-1.5 text-xs">
            {sections.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className={`grid h-4 w-4 flex-none place-items-center rounded-full text-[10px] font-bold text-white ${
                    s.filled ? "bg-calabar-green-600" : "bg-stone-300"
                  }`}
                >
                  {s.filled ? "✓" : i + 1}
                </span>
                <span className={s.filled ? "text-stone-700" : "text-stone-500"}>{s.title}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            {done} / {sections.length} sections drafted
          </p>
        </>
      )}
    </PanelCard>
  );
}

function StatsSection({ body }: { body: string }) {
  const stats = useMemo(() => computeStats(body), [body]);
  return (
    <PanelCard icon={Sparkles} title="Smart school assistant">
      <dl className="space-y-1 text-xs">
        <Row k="Words" v={stats.words} />
        <Row k="Characters" v={stats.chars} />
        <Row k="Sentences" v={stats.sentences} />
        <Row k="Paragraphs" v={stats.paragraphs} />
        <Row k="Avg words / sentence" v={stats.avgWordsPerSentence} />
        <Row k="Reading time" v={`${stats.readingMinutes} min`} />
      </dl>
      {stats.tips.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-stone-600">
          {stats.tips.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-stone-100 pt-2 text-[10px] uppercase tracking-wider text-stone-400">
        AI-powered grammar &amp; suggestions coming soon.
      </p>
    </PanelCard>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function CitationsSection({ editor, citations, setCitations, canEdit }: PanelProps) {
  function add() {
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
    if (editor) {
      editor.chain().focus().insertContent(` [${next.id}]`).run();
    }
  }
  function remove(id: number) {
    if (!confirm("Delete this citation?")) return;
    setCitations((prev) => prev.filter((c) => c.id !== id));
  }
  return (
    <PanelCard icon={Quote} title="Citations">
      <button
        type="button"
        onClick={add}
        disabled={!canEdit}
        className="btn-secondary w-full justify-center text-xs disabled:opacity-60"
      >
        Insert citation
      </button>
      {citations.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs">
          {citations.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="font-mono text-[10px] text-stone-500">[{c.id}]</span>{" "}
                <span className="truncate">{c.title}</span>
              </span>
              {canEdit && (
                <button onClick={() => remove(c.id)} className="text-red-700 hover:underline">
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function AttachSection(p: PanelProps) {
  return (
    <PanelCard icon={Paperclip} title="Linked artefacts">
      <label className="label text-xs">Spreadsheet</label>
      <select
        value={p.sheetId ?? ""}
        onChange={(e) => p.setSheetId(e.target.value || null)}
        className="input"
        disabled={!p.canEdit}
      >
        <option value="">None</option>
        {p.spreadsheets.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>
      {p.sheetId && (
        <a href={`/tools/sheets/${p.sheetId}`} className="mt-1 block text-xs text-calabar-green-700 hover:underline">
          Open linked sheet →
        </a>
      )}

      <label className="label mt-3 text-xs">Slide deck</label>
      <select
        value={p.deckId ?? ""}
        onChange={(e) => p.setDeckId(e.target.value || null)}
        className="input"
        disabled={!p.canEdit}
      >
        <option value="">None</option>
        {p.slideDecks.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>
      {p.deckId && (
        <a href={`/tools/slides/${p.deckId}`} className="mt-1 block text-xs text-calabar-green-700 hover:underline">
          Open linked deck →
        </a>
      )}
    </PanelCard>
  );
}

function VersionsSection(p: PanelProps) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  async function snapshot() {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("document_versions")
      .insert({
        document_id: p.id,
        title: p.title,
        body: p.body,
        saved_by: user.user?.id ?? null,
        note: note || null,
      })
      .select("id, title, body, note, created_at")
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    p.setVersions((prev) => [data as DocVersion, ...prev]);
    setNote("");
  }

  async function restore(v: DocVersion) {
    if (!confirm(`Restore "${v.title}" from ${new Date(v.created_at).toLocaleString()}?`)) return;
    p.setBody(v.body);
  }

  return (
    <PanelCard icon={History} title="Version history">
      {p.canEdit && (
        <div className="space-y-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Snapshot note (optional)"
            className="input text-xs"
          />
          <button
            type="button"
            onClick={() => startTransition(snapshot)}
            disabled={pending}
            className="btn-secondary w-full justify-center text-xs disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save version now"}
          </button>
        </div>
      )}
      {p.versions.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs">
          {p.versions.slice(0, 10).map((v) => (
            <li key={v.id} className="rounded-xl bg-stone-50 p-2">
              <p className="font-medium">{v.title || "Untitled"}</p>
              {v.note && <p className="text-stone-600">{v.note}</p>}
              <p className="mt-1 flex items-center justify-between text-stone-500">
                <span>{new Date(v.created_at).toLocaleString()}</span>
                {p.canEdit && (
                  <button onClick={() => restore(v)} className="text-calabar-green-700 hover:underline">
                    Restore
                  </button>
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-stone-500">No saved versions yet.</p>
      )}
    </PanelCard>
  );
}

function ActionsSection({ id, title, body, citations, status, setStatus, canEdit }: PanelProps) {
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!confirm("Submit this document for teacher review?")) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", id);
    setPending(false);
    if (error) {
      alert(error.message);
      return;
    }
    setStatus("submitted");
  }

  const exportPdf = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  const exportDoc = useCallback(() => {
    const safeTitle = (title || "document").replace(/[^\w\-]+/g, "_");
    const refsHtml =
      citations.length > 0
        ? `<h2>Bibliography</h2><ol>${citations
            .map(
              (c) =>
                `<li><strong>${escapeHtml(c.title)}</strong>${
                  c.source ? ` — ${escapeHtml(c.source)}` : ""
                }${c.url ? ` — ${escapeHtml(c.url)}` : ""}</li>`,
            )
            .join("")}</ol>`
        : "";
    const html =
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>body{font-family:Calibri,Arial,sans-serif;line-height:1.5;margin:1in;}h1{font-size:24pt;}h2{font-size:18pt;}p{margin:8pt 0;}</style>` +
      `</head><body><h1>${escapeHtml(title)}</h1>${body}${refsHtml}</body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, body, citations]);

  return (
    <PanelCard icon={ClipboardList} title="Actions">
      <button
        type="button"
        onClick={exportPdf}
        className="btn-secondary w-full justify-center text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={exportDoc}
        className="btn-secondary mt-2 w-full justify-center text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Export Word (.doc)
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={!canEdit || status === "submitted" || pending}
        className="btn-primary mt-2 w-full justify-center text-xs disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {status === "submitted"
          ? "Submitted"
          : status === "reviewed"
            ? "Reviewed — resubmit"
            : "Submit for review"}
      </button>
    </PanelCard>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function SbaCheckerSection({ body, citations, status }: PanelProps) {
  const checks = useMemo(() => buildSbaChecks(body, citations.length, status), [
    body,
    citations.length,
    status,
  ]);
  const done = checks.filter((c) => c.ok).length;
  return (
    <PanelCard icon={ListChecks} title="SBA checker">
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full transition-all ${
            done === checks.length ? "bg-calabar-green-600" : "bg-calabar-gold-500"
          }`}
          style={{ width: `${(done / checks.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-1.5 text-xs">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span
              className={`mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full text-[10px] font-bold ${
                c.ok ? "bg-calabar-green-600 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {c.ok ? "✓" : "·"}
            </span>
            <span className={c.ok ? "text-stone-700" : "text-stone-500"}>
              <span className="font-medium">{c.label}</span>
              {!c.ok && c.hint && <span className="ml-1 text-stone-400">— {c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500">
        {done} of {checks.length} checks passed
      </p>
    </PanelCard>
  );
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
    {
      label: "Cover page (title set)",
      ok: words > 0,
      hint: "Give the document a clear title.",
    },
    {
      label: "Table of contents (≥3 H2 sections)",
      ok: headings.length >= 3,
      hint: "Add at least three Heading 2 sections.",
    },
    {
      label: "Introduction / Aim",
      ok: has(["introduction", "aim", "problem", "purpose", "background"]),
      hint: "Add an Introduction or Aim section.",
    },
    {
      label: "Methodology",
      ok: has(["method", "procedure", "design", "approach"]),
      hint: "Add a Methodology section.",
    },
    {
      label: "Analysis / Findings",
      ok: has(["analysis", "findings", "results", "data", "discussion"]),
      hint: "Add an Analysis or Findings section.",
    },
    {
      label: "Conclusion",
      ok: has(["conclusion", "recommendations"]),
      hint: "Add a Conclusion.",
    },
    {
      label: "Bibliography",
      ok: citationCount > 0 || has(["bibliography", "references"]),
      hint: "Use Insert citation or add a Bibliography heading.",
    },
    {
      label: "Word count (≥ 800)",
      ok: words >= 800,
      hint: `Currently ${words} words.`,
    },
    {
      label: "Submitted for review",
      ok: status !== "draft",
      hint: "Hit Submit when ready.",
    },
  ];
}

// -- Helpers --

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
    tips.push("Avoid contractions in formal writing — expand them (e.g. ‘do not’).");
  if (/\bvery\b/i.test(plain))
    tips.push("‘Very’ rarely adds meaning. Pick a sharper word.");
  if (words > 100 && !/\b(however|therefore|because|moreover|in addition|consequently)\b/i.test(plain))
    tips.push("Add transition words (however, therefore, because) to connect ideas.");
  if (/(I think|I believe|in my opinion)/i.test(plain) && words > 300)
    tips.push("In academic essays, state claims directly rather than ‘I think’.");
  return { words, chars, sentences, paragraphs, avgWordsPerSentence, readingMinutes, tips };
}
