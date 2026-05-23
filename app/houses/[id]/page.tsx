export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import StudentProfileCard from "@/components/student-profile-card";
import type { Profile, House } from "@/types";

export default async function HouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: house }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("houses").select("*").eq("id", id).single(),
    supabase.from("profiles").select("*").eq("house_id", id).order("full_name").limit(40),
  ]);

  if (!profile) redirect("/signup");
  if (!house) notFound();

  const isMyHouse = profile.house_id === id;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* House header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">House</p>
              <h1 className="text-3xl font-black mt-1">{(house as House).name}</h1>
              {(house as House).motto && <p className="text-sm italic text-zinc-400 mt-2">&quot;{(house as House).motto}&quot;</p>}
              {(house as House).description && <p className="text-sm text-zinc-300 mt-3">{(house as House).description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black text-green-400">{(house as House).member_count}</p>
              <p className="text-xs text-zinc-500">members</p>
            </div>
          </div>
          {isMyHouse && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-950 border border-green-800 px-3 py-1 text-xs font-semibold text-green-400">
              🦁 Your House
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <h2 className="font-black mb-4">Members ({members?.length ?? 0})</h2>
          <div className="space-y-3">
            {members?.map((m: Profile) => <StudentProfileCard key={m.id} profile={m} />)}
            {(!members || members.length === 0) && (
              <div className="card text-center py-8">
                <p className="text-zinc-500">No members assigned to this house yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
