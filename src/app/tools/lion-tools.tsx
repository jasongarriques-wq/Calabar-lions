"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PenSquare, Presentation, Sheet, Notebook, FolderKanban } from "lucide-react";
import { LION_TOOLS, type LionToolMeta } from "./tool-data";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  docs: PenSquare,
  slides: Presentation,
  sheets: Sheet,
  notes: Notebook,
  sba: FolderKanban,
};

export function LionToolsGrid() {
  const apps = LION_TOOLS.filter((t) => t.slug !== "sba");
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-calabar-green-900 via-calabar-green-800 to-calabar-ink p-8 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-calabar-gold-300">
          Lion Tools
        </p>
        <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">
          Your Calabar workspace, built in.
        </h1>
        <p className="mt-3 max-w-2xl italic text-calabar-gold-200">
          Write like a Lion. Submit with pride.
        </p>
        <p className="mt-3 max-w-2xl text-stone-200">
          Write essays, build presentations, crunch spreadsheets, capture notes, and run full
          SBA projects &mdash; all signed in with your Calabar Lions account.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Pill>SBA Ready</Pill>
          <Pill>Cloud Collaboration</Pill>
          <Pill>Teacher Review</Pill>
          <Pill>Auto Save</Pill>
        </div>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black">SBA Workspace</h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              Run a full School-Based Assessment: essay, spreadsheet, slides, teacher review,
              and version history &mdash; all linked under one project.
            </p>
          </div>
          <Link href="/tools/sba" className="btn-primary text-sm">
            <FolderKanban className="h-4 w-4" />
            New SBA project
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile title="Essay Writing" body="Introduction, methodology, analysis, conclusion, bibliography." />
          <Tile title="Spreadsheet Analysis" body="Charts, formulas, financial analysis, survey calculations." />
          <Tile title="Presentation Builder" body="Final oral presentations with slides and media support." />
          <Tile title="Teacher Review" body="Comments, grading, approvals, and revision tracking." />
        </div>
      </section>
    </>
  );
}

function AppCard({ app }: { app: LionToolMeta }) {
  const Icon = ICONS[app.slug] ?? Notebook;
  return (
    <motion.div whileHover={{ y: -4 }} className="card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-calabar-ink">{app.name}</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-calabar-green-700">
            {app.type}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-calabar-green-50">
          <Icon className="h-6 w-6 text-calabar-green-800" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-stone-600">{app.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {app.features.map((feature) => (
          <span
            key={feature}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link href={`/tools/${app.slug}`} className="btn-primary justify-center text-xs">
          Open
        </Link>
        <Link href={`/tools/${app.slug}?new=1`} className="btn-secondary justify-center text-xs">
          New file
        </Link>
      </div>
    </motion.div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
      {children}
    </span>
  );
}

function Tile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-stone-500">{body}</p>
    </div>
  );
}
