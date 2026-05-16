import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle<{ role: string | null }>();

  if (me?.role !== "admin") redirect("/dashboard");

  const [{ count: userCount }, { count: reportCount }, { count: pendingMentors }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("mentors").select("id", { count: "exact", head: true }).eq("approved", false),
  ]);

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, status, created_at, target_type")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-2 text-stone-600">Moderation, approvals, and platform health.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Total users" value={userCount ?? 0} />
          <Stat label="Open reports" value={reportCount ?? 0} accent="red" />
          <Stat label="Pending mentor approvals" value={pendingMentors ?? 0} accent="gold" />
        </div>

        <div className="mt-8 card">
          <h2 className="text-lg font-semibold text-calabar-green-800">Open reports</h2>
          <ul className="mt-4 divide-y divide-stone-200 text-sm">
            {(reports ?? []).length === 0 && (
              <li className="py-3 text-stone-500">No open reports — all clear.</li>
            )}
            {(reports ?? []).map((r) => {
              const row = r as unknown as {
                id: string;
                reason: string;
                status: string;
                created_at: string;
                target_type: string;
              };
              return (
                <li key={row.id} className="flex flex-wrap justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{row.reason}</p>
                    <p className="text-xs text-stone-500">{row.target_type}</p>
                  </div>
                  <span className="text-xs text-stone-500">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "red" | "gold";
}) {
  const cls =
    accent === "red"
      ? "text-red-700"
      : accent === "gold"
        ? "text-calabar-gold-700"
        : "text-calabar-green-700";
  return (
    <div className="card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${cls}`}>{value.toLocaleString()}</p>
    </div>
  );
}
