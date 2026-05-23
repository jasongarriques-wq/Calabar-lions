export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";

const statusColors: Record<string, string> = {
  not_started: "bg-zinc-800 text-zinc-400",
  in_progress: "bg-blue-950/50 text-blue-400 border border-blue-800/50",
  submitted: "bg-amber-950/50 text-amber-400 border border-amber-800/50",
  graded: "bg-green-950/50 text-green-400 border border-green-800/50",
};

export default async function SbaProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const { data: proj, error } = await supabase
    .from("sba_projects")
    .select("*, subjects(*)")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !proj) redirect("/tools/sba");

  const progress = proj.progress ?? 0;

  // Try to get linked tool IDs if columns exist
  const docId = (proj as any).document_id as string | null ?? null;
  const sheetId = (proj as any).spreadsheet_id as string | null ?? null;
  const deckId = (proj as any).slide_deck_id as string | null ?? null;

  const linkedTools = [
    {
      icon: "📝",
      name: "Essay Doc",
      description: "Your SBA write-up, lit review, and methodology.",
      href: docId ? `/tools/docs/${docId}` : "/tools/docs",
      type: "LION DOCS",
      available: !!docId,
    },
    {
      icon: "📊",
      name: "Data Sheet",
      description: "Record and analyse your data with formulas and CSV export.",
      href: sheetId ? `/tools/sheets/${sheetId}` : "/tools/sheets",
      type: "LION SHEETS",
      available: !!sheetId,
    },
    {
      icon: "📽️",
      name: "Presentation",
      description: "5-slide deck pre-structured for your SBA defence.",
      href: deckId ? `/tools/slides/${deckId}` : "/tools/slides",
      type: "LION SLIDES",
      available: !!deckId,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-2">
          <Link href="/tools/sba" className="text-xs text-zinc-500 hover:text-zinc-300">← SBA Workspace</Link>
        </div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">{proj.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {(proj as any).subjects?.name ?? "General"} ·{" "}
              {proj.due_date
                ? `Due ${new Date(proj.due_date).toLocaleDateString("en-JM", { month: "long", day: "numeric", year: "numeric" })}`
                : "No due date set"}
            </p>
          </div>
          <span className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[proj.status ?? "not_started"] ?? statusColors.not_started}`}>
            {(proj.status ?? "not_started").replace("_", " ")}
          </span>
        </div>

        {/* Progress */}
        <div className="card mb-6">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span className="text-zinc-400">Overall Progress</span>
            <span className="text-green-400">{progress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-800">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 25, 50, 75, 100].map((pct) => (
              <span key={pct} className={`text-center text-[10px] font-semibold ${progress >= pct ? "text-green-400" : "text-zinc-700"}`}>
                {pct}%
              </span>
            ))}
          </div>
        </div>

        {/* Linked Tools */}
        <h2 className="mb-3 font-black text-zinc-300">Linked Tools</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {linkedTools.map((tool) => (
            <Link key={tool.name} href={tool.href} className="card group flex flex-col gap-3 hover:border-zinc-600 transition-colors">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{tool.type}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-3xl">{tool.icon}</span>
                  <h3 className="font-black text-white">{tool.name}</h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{tool.description}</p>
              </div>
              {!tool.available && (
                <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] text-zinc-500">
                  Not linked — click to browse
                </span>
              )}
              <span className="btn-secondary mt-auto text-center text-xs group-hover:bg-zinc-600">
                Open →
              </span>
            </Link>
          ))}
        </div>

        {/* Quick links to tool lists */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/tools/docs" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">All Docs</Link>
          <span className="text-zinc-800">·</span>
          <Link href="/tools/sheets" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">All Sheets</Link>
          <span className="text-zinc-800">·</span>
          <Link href="/tools/slides" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">All Slides</Link>
          <span className="text-zinc-800">·</span>
          <Link href="/tools" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Lion Tools Hub</Link>
        </div>
      </main>
    </div>
  );
}
