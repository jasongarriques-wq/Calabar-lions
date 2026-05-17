"use client";

import Link from "next/link";
import { useState } from "react";
import { PenSquare, Sheet, Presentation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";

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

export function SbaProjectEditor({ project }: { project: Project }) {
  const [title, setTitle] = useState(project.title);
  const [subject, setSubject] = useState(project.subject);
  const [status, setStatus] = useState(project.status ?? "not_started");
  const [percent, setPercent] = useState(project.percent_complete ?? 0);
  const [dueDate, setDueDate] = useState(project.due_date ?? "");
  const [notes, setNotes] = useState(project.notes ?? "");

  const { status: saveStatus, error } = useAutosave(
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
  );

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-display text-3xl font-bold focus:outline-none"
        />
        <SaveStatusPill status={saveStatus} error={error} />
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="mt-1 w-full bg-transparent text-sm text-stone-600 focus:outline-none"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select
            id="status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="percent" className="label">Progress ({percent}%)</label>
          <input
            id="percent"
            type="range"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="due" className="label">Due date</label>
          <input
            id="due"
            type="date"
            value={dueDate ?? ""}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-bold">Linked tools</h2>
      <p className="mt-1 text-sm text-stone-600">
        Each project gets a doc, a sheet, and a deck. Edit any of them; the project tracks them together.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ToolLink
          href={project.document_id ? `/tools/docs/${project.document_id}` : "/tools/docs"}
          title="Essay"
          subtitle="Open in Lion Docs"
          Icon={PenSquare}
        />
        <ToolLink
          href={project.spreadsheet_id ? `/tools/sheets/${project.spreadsheet_id}` : "/tools/sheets"}
          title="Data sheet"
          subtitle="Open in Lion Sheets"
          Icon={Sheet}
        />
        <ToolLink
          href={project.slide_deck_id ? `/tools/slides/${project.slide_deck_id}` : "/tools/slides"}
          title="Slide deck"
          subtitle="Open in Lion Slides"
          Icon={Presentation}
        />
      </div>

      <h2 className="mt-8 font-display text-xl font-bold">Project notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="Research questions, hypothesis, methodology…"
        className="input mt-3 resize-y"
      />
    </div>
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
    <Link href={href} className="card block transition hover:border-calabar-green-300">
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
