export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";
import { createDocument, createSpreadsheet, createSlideDeck } from "./actions";

const tools = [
  {
    key: "docs",
    icon: "📝",
    name: "Lion Docs",
    type: "DOCUMENTS",
    description: "Write essays, lab reports, and SBA write-ups with a full rich-text editor.",
    features: ["Rich text editor", "Status tracking", "Template library"],
    href: "/tools/docs",
  },
  {
    key: "notes",
    icon: "📓",
    name: "Lion Notes",
    type: "NOTES",
    description: "Quick notes, study summaries, and revision cards — all in one place.",
    features: ["Fast capture", "Subject tags", "Grid view"],
    href: "/tools/notes",
  },
  {
    key: "sheets",
    icon: "📊",
    name: "Lion Sheets",
    type: "SPREADSHEETS",
    description: "Data collection, SUM formulas, and CSV export for science and business SBAs.",
    features: ["10-column grid", "SUM formulas", "CSV export"],
    href: "/tools/sheets",
  },
  {
    key: "slides",
    icon: "📽️",
    name: "Lion Slides",
    type: "PRESENTATIONS",
    description: "Build presentation decks with slide thumbnails, color themes, and preview mode.",
    features: ["Slide builder", "Color themes", "Full-screen preview"],
    href: "/tools/slides",
  },
];

export default async function ToolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-green-950 via-zinc-950 to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#14532d33_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {["SBA Ready", "Auto Save", "Cloud Sync", "Teacher Review"].map((badge) => (
                  <span key={badge} className="rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-400">
                    {badge}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                🛠️ Lion Tools
              </h1>
              <p className="mt-2 text-lg text-zinc-400">
                Your Calabar workspace, built in.
              </p>
            </div>
            <Link href="/tools/sba" className="btn-primary shrink-0 text-base">
              🗂️ Open SBA Workspace
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 4 tool cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <div key={tool.key} className="card flex flex-col gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">{tool.type}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-3xl">{tool.icon}</span>
                  <h2 className="text-xl font-black text-white">{tool.name}</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tool.features.map((f) => (
                  <span key={f} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={tool.href} className="btn-primary flex-1 text-center text-xs">
                  Open
                </Link>
                {tool.key === "docs" && (
                  <form action={createDocument.bind(null, "doc")}>
                    <button type="submit" className="btn-secondary text-xs">New file</button>
                  </form>
                )}
                {tool.key === "notes" && (
                  <form action={createDocument.bind(null, "note")}>
                    <button type="submit" className="btn-secondary text-xs">New note</button>
                  </form>
                )}
                {tool.key === "sheets" && (
                  <form action={createSpreadsheet}>
                    <button type="submit" className="btn-secondary text-xs">New sheet</button>
                  </form>
                )}
                {tool.key === "slides" && (
                  <form action={createSlideDeck}>
                    <button type="submit" className="btn-secondary text-xs">New deck</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* SBA Workspace full-width card */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-green-900/60 bg-gradient-to-r from-green-950/60 to-zinc-900">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="text-5xl">🗂️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">SBA WORKSPACE</p>
                <h2 className="mt-0.5 text-2xl font-black text-white">Lion SBA Workspace</h2>
                <p className="mt-1 text-sm text-zinc-400 max-w-xl">
                  The all-in-one SBA hub. Create a project and get a linked essay doc, data sheet, and slide deck — pre-loaded with the right template for your CSEC or CAPE subject.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["CSEC & CAPE", "28 Subjects", "Auto Templates", "Linked Docs", "Progress Tracking"].map((f) => (
                    <span key={f} className="rounded-lg border border-green-900/50 bg-green-950/40 px-2 py-1 text-xs font-semibold text-green-400">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <Link href="/tools/sba" className="btn-primary text-center">
                Open SBA Workspace
              </Link>
              <Link href="/tools/sba" className="btn-secondary text-center">
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
