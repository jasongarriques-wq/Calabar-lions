export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import GroupCard from "@/components/group-card";
import Link from "next/link";
import type { Profile, Group } from "@/types";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: groups }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("groups").select("*").eq("is_private", false).order("member_count", { ascending: false }).limit(30),
  ]);

  const groupTypes = ["all", "subject", "school", "sba", "club", "house", "general"];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Groups</h1>
            <p className="text-sm text-zinc-500">Find your study community</p>
          </div>
          <Link href="/groups/new" className="btn-primary">+ Create Group</Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {groupTypes.map(t => (
            <button key={t} className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-semibold capitalize hover:border-green-700 hover:text-green-400 transition-colors">
              {t === "all" ? "All Groups" : t}
            </button>
          ))}
        </div>

        {/* Groups grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {groups?.map((g: Group) => <GroupCard key={g.id} group={g} />)}
          {(!groups || groups.length === 0) && (
            <div className="col-span-2 card text-center py-12">
              <p className="text-zinc-500">No groups yet. Be the first to create one!</p>
              <Link href="/groups/new" className="btn-primary mt-4 inline-block">Create a Group</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
