export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import HouseCard from "@/components/house-card";
import type { Profile, House } from "@/types";

export default async function HousesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: houses }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("houses").select("*").order("name"),
  ]);

  if (!profile) redirect("/signup");

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">🏛️ Houses</h1>
          <p className="text-sm text-zinc-500">Calabar&apos;s four proud houses</p>
        </div>

        {/* My House highlight */}
        {profile.house_id && (
          <div className="mb-6 rounded-2xl border border-green-800 bg-green-950/30 p-4 flex items-center gap-3">
            <span className="text-2xl">🦁</span>
            <div>
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Your House</p>
              <p className="font-black">
                {houses?.find((h: House) => h.id === profile.house_id)?.name ?? "Unknown"} House
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {houses?.map((h: House) => <HouseCard key={h.id} house={h} />)}
          {(!houses || houses.length === 0) && (
            <div className="col-span-2 card text-center py-12">
              <p className="text-zinc-500">No houses found. Run the schema SQL in Supabase.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
