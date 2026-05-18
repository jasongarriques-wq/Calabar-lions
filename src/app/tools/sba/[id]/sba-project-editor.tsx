"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, PenSquare, Presentation, Sheet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import {
  ToolShell,
  RibbonGroup,
  type ToolShellAuthor,
} from "@/components/tool-shell";

type Project = {
  id: string;
  title: string;
  subject: string;
  status: string | null;
  percent_complete: number | null;
  due_date: string | null;
  notes: string | null;
  document_id: string | null;
  spreadsheet_id: string | null;
  slide_deck_id: string | null;
};

const STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Submitted" },
  { value: "graded", label: "Graded" },
];

const TABS = ["Project", "Files", "Feedback", "Submission"];

export function SbaProjectEditor({
  project,
  author,
  canEdit,
  filesPanel,
  commentsPanel,
}: {
  project: Project;
  author: ToolShellAuthor;
  canEdit: boolean;
  filesPanel: React.ReactNode;
  commentsPanel: React.ReactNode;
}) {
  const [title, setTitle] = useState(project.title);
  const [subject, setSubject] = useState(project.subject);
  const [status, setStatus] = useState(project.status ?? "not_started");
  const [percent, setPercent] = useState(project.percent_complete ?? 0);
  const [dueDate, setDueDate] = useState(project.due_date ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");
  const [tab, setTab] = useState("Project");

  const { status: saveStatus } = useAutosave(
    { title, subject, status, percent, dueDate, notes },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sba_projects")
        .update({
          title: v.title,
          subject: v.subject,
          status: v.status,
          percent_complete: v.percent,
          due_date: v.dueDate || null,
          notes: v.notes,
        })
        .eq("id", project.id);
      if (error) throw new Error(error.message);
    },
    { enabled: canEdit },
  );

  return (
    <ToolShell
      appName="SBA Workspace"
      appTagline="One project. Linked tools. Submitted with pride."
      badge="SBA Project"
      title={title}
      setTitle={canEdit ? setTitle : undefined}
      saveStatus={saveStatus}
      author={author}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      canEdit={canEdit}
      statusItems={
        <>
          <span>{subject}</span>
          <span>·</span>
          <span>{percent}% complete</span>
          {dueDate && (
            <>
              <span>·</span>
              <span>Due {new Date(dueDate).toLocaleDateString()}</span>
            </>
          )}
        </>
      }
      toolbar={
        <>
          <RibbonGroup label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!canEdit}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </RibbonGroup>
          <RibbonGroup label="Progress">
            <div className="flex items-center gap-2 text-xs">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                disabled={!canEdit}
                className="w-32"
              />
              <span className="font-semibold">{percent}%</span>
            </div>
          </RibbonGroup>
          <RibbonGroup label="Due date">
            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            />
          </RibbonGroup>
          <RibbonGroup label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!canEdit}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              placeholder="e.g. Biology"
            />
          </RibbonGroup>
        </>
      }
    >
      <div className="min-h-0 flex-1 overflow-auto bg-[#c9cfdb] p-6">
        <div
          className="mx-auto rounded-md bg-white p-8 shadow-sm ring-1 ring-slate-200"
          style={{ maxWidth: 1100 }}
        >
          {tab === "Project" && (
            <>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <ClipboardList className="h-5 w-5 text-calabar-green-700" />
                Linked tools
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                The doc, the data sheet, and the deck for this SBA — all linked together.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <ToolLink
                  href={project.document_id ? `/tools/docs/${project.document_id}` : "/tools/docs"}
                  title="Essay"
                  subtitle="Lion Docs"
                  Icon={PenSquare}
                />
                <ToolLink
                  href={project.spreadsheet_id ? `/tools/sheets/${project.spreadsheet_id}` : "/tools/sheets"}
                  title="Data sheet"
                  subtitle="Lion Sheets"
                  Icon={Sheet}
                />
                <ToolLink
                  href={project.slide_deck_id ? `/tools/slides/${project.slide_deck_id}` : "/tools/slides"}
                  title="Slide deck"
                  subtitle="Lion Slides"
                  Icon={Presentation}
                />
              </div>

              <h2 className="mt-10 font-display text-xl font-bold">Project notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canEdit}
                rows={10}
                placeholder="Research questions, hypothesis, methodology…"
                className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-calabar-green-200 disabled:opacity-80"
              />
            </>
          )}

          {tab === "Files" && filesPanel}
          {tab === "Feedback" && commentsPanel}
          {tab === "Submission" && (
            <div>
              <h2 className="font-display text-xl font-bold">Submission</h2>
              <p className="mt-2 text-sm text-stone-600">
                When you&rsquo;re ready, change the status to <em>Submitted</em>. Your teacher gets a
                notification immediately.
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-stone-700">Current status</p>
                <p className="mt-1 text-2xl font-bold text-calabar-green-800">
                  {STATUSES.find((s) => s.value === status)?.label ?? status}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}

function ToolLink({
  href,
  title,
  subtitle,
  Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-calabar-green-300"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-calabar-green-50">
          <Icon className="h-5 w-5 text-calabar-green-800" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
