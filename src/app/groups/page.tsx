import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Groups" };

const TYPES = [
  { value: "house", label: "House" },
  { value: "form", label: "Form" },
  { value: "class", label: "Class" },
  { value: "subject", label: "Subject" },
  { value: "sba", label: "SBA" },
  { value: "club", label: "Club" },
  { value: "sport", label: "Sports team" },
  { value: "alumni", label: "Alumni" },
];

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("groups")
    .select("id, name, type, description, member_count:group_members(count)")
    .is("parent_id", null)
    .order("name");
  if (type) query = query.eq("type", type);
  const { data: groups } = await query;

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Groups</h1>
            <p className="mt-2 text-stone-600">
              Every house, form, class, subject, club, and team has a home here.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link href="/groups" className={`pill ${!type ? "bg-calabar-green-700 text-white" : "bg-stone-100"}`}>
              All
            </Link>
            {TYPES.map((t) => (
              <Link
                key={t.value}
                href={`/groups?type=${t.value}`}
                className={`pill ${type === t.value ? "bg-calabar-green-700 text-white" : "bg-stone-100"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(groups ?? []).length === 0 && (
            <p className="text-sm text-stone-500">No groups in this category yet.</p>
          )}
          {(groups ?? []).map((g) => {
            const row = g as unknown as {
              id: string;
              name: string;
              type: string;
              description: string | null;
              member_count?: { count: number }[];
            };
            const count = row.member_count?.[0]?.count ?? 0;
            return (
              <Link
                key={row.id}
                href={`/groups/${row.id}`}
                className="card transition hover:border-calabar-green-300 hover:shadow-md"
              >
                <span className="pill bg-calabar-gold-100 text-calabar-gold-800">{row.type}</span>
                <h3 className="mt-2 font-semibold">{row.name}</h3>
                {row.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">{row.description}</p>
                )}
                <p className="mt-3 text-xs text-stone-500">{count} members</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
