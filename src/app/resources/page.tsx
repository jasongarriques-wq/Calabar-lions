import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ResourceCard } from "@/components/resource-card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Resource library" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("id, title, subject, kind, url, created_at")
    .order("created_at", { ascending: false });
  if (subject) query = query.eq("subject", subject);
  const { data: resources } = await query;

  const subjects = Array.from(
    new Set((resources ?? []).map((r) => (r as { subject: string }).subject)),
  );

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Resource library</h1>
        <p className="mt-2 text-stone-600">
          Past papers, study notes, and uploads from teachers and seniors.
        </p>

        {subjects.length > 0 && (
          <nav className="mt-6 flex flex-wrap gap-2">
            <Link href="/resources" className={`pill ${!subject ? "bg-calabar-green-700 text-white" : "bg-stone-100"}`}>
              All
            </Link>
            {subjects.map((s) => (
              <Link
                key={s}
                href={`/resources?subject=${encodeURIComponent(s)}`}
                className={`pill ${subject === s ? "bg-calabar-green-700 text-white" : "bg-stone-100"}`}
              >
                {s}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(resources ?? []).length === 0 && (
            <p className="text-sm text-stone-500">No resources uploaded yet.</p>
          )}
          {(resources ?? []).map((r) => {
            const row = r as unknown as {
              id: string;
              title: string;
              subject: string;
              kind: string;
              url: string;
            };
            return (
              <ResourceCard
                key={row.id}
                title={row.title}
                subject={row.subject}
                kind={row.kind}
                url={row.url}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
