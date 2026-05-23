import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notifications" };

type Row = {
  id: string;
  kind: string;
  payload: { title?: string; body?: string; href?: string } | null;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (data as Row[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 text-stone-600">Everything you&rsquo;ve been pinged about.</p>

        <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {items.length === 0 && (
            <li className="p-6 text-sm text-stone-500">Nothing here yet.</li>
          )}
          {items.map((n) => {
            const title = n.payload?.title ?? formatKind(n.kind);
            const body = n.payload?.body;
            const Inner = (
              <div className={n.read_at ? "opacity-60" : ""}>
                <p className="text-sm font-medium">{title}</p>
                {body && <p className="mt-1 text-sm text-stone-600">{body}</p>}
                <p className="mt-1 text-xs text-stone-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            );
            return (
              <li key={n.id} className="p-4 hover:bg-stone-50">
                {n.payload?.href ? <Link href={n.payload.href}>{Inner}</Link> : Inner}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function formatKind(kind: string) {
  return kind.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
