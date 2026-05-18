"use client";

import { useState } from "react";
import { Bold, Italic, List, ListOrdered, Tag, Strikethrough } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import {
  ToolShell,
  RibbonGroup,
  RibbonIcon,
  type ToolShellAuthor,
} from "@/components/tool-shell";

const TABS = ["File", "Home", "Insert", "View", "Help"];

export function NoteEditor({
  id,
  initialTitle,
  initialBody,
  initialSubject,
  author,
  canEdit,
}: {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialSubject: string;
  author: ToolShellAuthor;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [subject, setSubject] = useState(initialSubject);
  const [tab, setTab] = useState("Home");

  const { status } = useAutosave(
    { title, body, subject },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({ title: v.title, body: v.body, subject: v.subject || null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    { enabled: canEdit },
  );

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <ToolShell
      appName="Lion Notes"
      appTagline="Capture every Calabar moment."
      badge="Note"
      title={title}
      setTitle={canEdit ? setTitle : undefined}
      saveStatus={status}
      author={author}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      canEdit={canEdit}
      statusItems={
        <>
          <span>{words.toLocaleString()} words</span>
          <span className="hidden sm:inline">English (Jamaica)</span>
        </>
      }
      toolbar={
        <>
          <RibbonGroup label="Format">
            <RibbonIcon icon={Bold} title="Bold" disabled={!canEdit} />
            <RibbonIcon icon={Italic} title="Italic" disabled={!canEdit} />
            <RibbonIcon icon={Strikethrough} title="Strike" disabled={!canEdit} />
          </RibbonGroup>
          <RibbonGroup label="Lists">
            <RibbonIcon icon={List} title="Bullets" disabled={!canEdit} />
            <RibbonIcon icon={ListOrdered} title="Numbered" disabled={!canEdit} />
          </RibbonGroup>
          <RibbonGroup label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!canEdit}
              placeholder="e.g. Chemistry"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            />
          </RibbonGroup>
        </>
      }
    >
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 print:bg-white print:p-0">
        <div
          className="mx-auto rounded-xl bg-[#fffceb] px-10 py-10 shadow-[0_6px_30px_rgba(15,23,42,0.18)] ring-1 ring-amber-200 print:max-w-none print:rounded-none print:shadow-none print:ring-0"
          style={{ width: "min(100%, 900px)", minHeight: 1200 }}
        >
          {subject && (
            <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-calabar-gold-100 px-3 py-1 text-xs font-semibold text-calabar-gold-800">
              <Tag className="h-3 w-3" />
              {subject}
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canEdit}
            placeholder="Capture your thinking…"
            rows={30}
            className="w-full resize-y bg-transparent text-base leading-relaxed focus:outline-none disabled:opacity-80"
          />
        </div>
      </div>
    </ToolShell>
  );
}
