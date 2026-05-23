export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";
import { createSbaProject } from "../actions";
import { SBA_CATEGORIES } from "@/lib/sba-subjects";

const statusColors: Record<string, string> = {
  not_started: "bg-zinc-800 text-zinc-400",
  in_progress: "bg-blue-950/50 text-blue-400 border border-blue-800/50",
  submitted: "bg-amber-950/50 text-amber-400 border border-amber-800/50",
  graded: "bg-green-950/50 text-green-400 border border-green-800/50",
};

export default async function SbaWorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const { data: projects } = await supabase
    .from("sba_projects")
    .select("*, subjects(*)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <Link href="/tools" className="text-xs text-zinc-500 hover:text-zinc-300">← Lion Tools</Link>
          <h1 className="mt-1 text-2xl font-black">🗂️ SBA Workspace</h1>
          <p className="text-sm text-zinc-400">Create a project and get linked essay, data sheet &amp; slides — pre-loaded with templates.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Projects list */}
          <div className="space-y-4">
            <h2 className="font-black text-zinc-300">My SBA Projects</h2>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((proj: any) => {
                  const progress = proj.progress ?? 0;
                  return (
                    <Link key={proj.id} href={`/tools/sba/${proj.id}`} className="card block hover:border-zinc-600 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-white line-clamp-1">{proj.title}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {proj.subjects?.name ?? proj.title} · {proj.due_date ? `Due ${new Date(proj.due_date).toLocaleDateString("en-JM", { month: "short", day: "numeric" })}` : "No due date"}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColors[proj.status] ?? statusColors.not_started}`}>
                          {(proj.status ?? "not_started").replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[10px] text-zinc-600">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div
                            className="h-1.5 rounded-full bg-green-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 py-12 text-center">
                <span className="text-4xl">🗂️</span>
                <h3 className="mt-3 font-black">No SBA projects yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Create one using the form.</p>
              </div>
            )}
          </div>

          {/* Create form */}
          <div className="card border-green-900/40 bg-green-950/10">
            <h2 className="mb-4 font-black text-white">+ New SBA Project</h2>
            <form action={createSbaProject} className="space-y-4">
              <div>
                <label className="label">Project Title</label>
                <input
                  name="title"
                  className="input"
                  placeholder="e.g. Biology SBA 2026"
                  required
                />
              </div>
              <div>
                <label className="label">Subject</label>
                <select name="subject_code" className="input" required>
                  <option value="">Select a subject…</option>
                  {SBA_CATEGORIES.map(({ category, subjects }) => (
                    <optgroup key={category} label={category}>
                      {subjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.track.toUpperCase()})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="rounded-xl bg-zinc-900 p-3 text-xs text-zinc-500">
                <p className="font-semibold text-zinc-400 mb-1">What gets created:</p>
                <ul className="space-y-1">
                  <li>📝 Essay doc — pre-loaded with subject template</li>
                  <li>📊 Data sheet — for recording results</li>
                  <li>📽️ Slide deck — 5-slide presentation structure</li>
                </ul>
              </div>
              <button type="submit" className="btn-primary w-full">
                Create SBA Project →
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
