import { Navbar } from "@/components/navbar";
import { HouseCard } from "@/components/house-card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Houses" };

export default async function HousesPage() {
  const supabase = await createClient();
  const { data: houses } = await supabase
    .from("houses")
    .select("id, name, motto, color, member_count:profiles(count)")
    .order("name");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Houses of Calabar</h1>
        <p className="mt-2 text-stone-600">
          Every Lion belongs to a House. Find yours, see standings, and connect.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(houses ?? []).length === 0 && (
            <p className="text-sm text-stone-500">No houses configured yet.</p>
          )}
          {(houses ?? []).map((h) => {
            const row = h as unknown as {
              id: string;
              name: string;
              motto: string | null;
              color: string | null;
              member_count?: { count: number }[] | number;
            };
            const count = Array.isArray(row.member_count)
              ? row.member_count[0]?.count ?? 0
              : (row.member_count as number | undefined) ?? 0;
            return (
              <HouseCard
                key={row.id}
                house={{
                  id: row.id,
                  name: row.name,
                  motto: row.motto,
                  color: row.color,
                  member_count: count,
                }}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
