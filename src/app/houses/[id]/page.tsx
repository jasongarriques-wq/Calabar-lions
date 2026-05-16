import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

export default async function HouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: house } = await supabase
    .from("houses")
    .select("id, name, motto, color")
    .eq("id", id)
    .maybeSingle();

  if (!house) notFound();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .eq("audience", `house:${id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, form")
    .eq("house_id", id)
    .order("form")
    .limit(50);

  const color = (house.color as string) ?? "#137c3d";

  return (
    <main>
      <Navbar />
      <section className="border-b border-stone-200" style={{ background: `${color}10` }}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl" style={{ background: color }} />
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {house.name as string}
              </h1>
              {house.motto && (
                <p className="text-stone-600 italic">“{house.motto as string}”</p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-calabar-green-800">House announcements</h2>
          <ul className="mt-4 divide-y divide-stone-200">
            {(announcements ?? []).length === 0 && (
              <li className="py-3 text-sm text-stone-500">No announcements yet.</li>
            )}
            {(announcements ?? []).map((a) => (
              <li key={a.id as string} className="py-3">
                <p className="text-sm font-semibold">{a.title as string}</p>
                <p className="text-sm text-stone-600">{a.body as string}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-calabar-green-800">Members</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(members ?? []).map((m) => (
              <li key={m.id as string} className="flex justify-between">
                <span>{(m.display_name as string) ?? (m.full_name as string)}</span>
                <span className="text-stone-500">Form {m.form as string}</span>
              </li>
            ))}
            {(members ?? []).length === 0 && (
              <li className="text-stone-500">No members yet.</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
