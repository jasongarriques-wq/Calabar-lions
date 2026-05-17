import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createSbaProject } from "../actions";
import { SBA_CATEGORIES } from "@/lib/sba-subjects";

export const metadata = { title: "SBA Workspace" };

type Project = {
  id: string;
  title: string;
  subject: string;
  status: string | null;
  percent_complete: number | null;
  due_date: string | null;
  updated_at: string;
};

export default async function SbaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("sba_projects")
    .select("id, title, subject, status, percent_complete, due_date, updated_at")
    .eq("student_id", user?.id ?? "")
    .order("updated_at", { ascending: false });
  const projects = (data as Project[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">SBA Workspace</h1>
          <p className="mt-1 text-stone-600">
            CSEC and CAPE School-Based Assessments &mdash; essay, data sheet, slide deck, research
            files, and teacher feedback in one project.
          </p>
        </div>

        <form action={createSbaProject} className="card mt-6">
          <h2 className="text-lg font-semibold text-calabar-green-800">New SBA project</h2>
          <p className="text-sm text-stone-600">
            Pick a subject &mdash; we seed the essay with the standard SBA outline and link a
            data sheet + slides.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="title" className="label">Project title</label>
              <input
                id="title"
                name="title"
                required
                className="input"
                placeholder="e.g. Effect of pH on Catalase Activity"
              />
            </div>
            <div>
              <label htmlFor="subject_code" className="label">Subject</label>
              <select id="subject_code" name="subject_code" required className="input min-w-64" defaultValue="">
                <option value="" disabled>Select a subject…</option>
                {SBA_CATEGORIES.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.subjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} · {s.track.toUpperCase()}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn-primary">
              Create project
            </button>
          </div>
        </form>

        {projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <FolderKanban className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No SBA projects yet.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/tools/sba/${p.id}`}
                  className="card block transition hover:border-calabar-green-300"
                >
                  <span className="pill bg-calabar-gold-100 text-calabar-gold-800">
                    {p.status?.replace("_", " ") ?? "not started"}
                  </span>
                  <h3 className="mt-2 font-semibold">{p.title}</h3>
                  <p className="text-sm text-stone-500">{p.subject}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full bg-calabar-green-600"
                      style={{
                        width: `${Math.max(0, Math.min(100, p.percent_complete ?? 0))}%`,
                      }}
                    />
                  </div>
                  {p.due_date && (
                    <p className="mt-2 text-xs text-stone-500">
                      Due {new Date(p.due_date).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
