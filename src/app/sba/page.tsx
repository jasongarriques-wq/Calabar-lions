import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "SBA Tracker" };

export default async function SbaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("sba_projects")
    .select("id, title, subject, due_date, status, percent_complete, notes")
    .eq("student_id", user?.id ?? "")
    .order("due_date", { ascending: true });

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">SBA tracker</h1>
        <p className="mt-2 text-stone-600">
          Stay on top of every School-Based Assessment, milestone by milestone.
        </p>

        <div className="mt-8 space-y-4">
          {(projects ?? []).length === 0 && (
            <p className="text-sm text-stone-500">
              No SBAs yet. Once your teachers (or you) add them, they appear here.
            </p>
          )}
          {(projects ?? []).map((p) => {
            const row = p as unknown as {
              id: string;
              title: string;
              subject: string;
              due_date: string | null;
              status: string | null;
              percent_complete: number | null;
              notes: string | null;
            };
            return (
              <article key={row.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{row.title}</h2>
                    <p className="text-sm text-stone-500">{row.subject}</p>
                  </div>
                  <span className="pill bg-calabar-gold-100 text-calabar-gold-800">
                    {row.status ?? "Not started"}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full bg-calabar-green-600"
                    style={{
                      width: `${Math.max(0, Math.min(100, row.percent_complete ?? 0))}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-stone-500">
                  <span>{row.percent_complete ?? 0}% complete</span>
                  {row.due_date && <span>Due {new Date(row.due_date).toLocaleDateString()}</span>}
                </div>
                {row.notes && <p className="mt-3 text-sm text-stone-600">{row.notes}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
