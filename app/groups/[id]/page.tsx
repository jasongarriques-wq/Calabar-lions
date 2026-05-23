export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import GroupFeed from "./group-feed";
import type { Profile, Group } from "@/types";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: group }, { data: memberCheck }, { data: posts }, { count: memberCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("groups").select("*").eq("id", id).single(),
    supabase.from("group_members").select("id").eq("group_id", id).eq("profile_id", user.id).maybeSingle(),
    supabase.from("posts").select("*, profiles(*)").eq("group_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", id),
  ]);

  if (!profile) redirect("/signup");
  if (!group) notFound();

  const isMember = !!memberCheck;
  const totalMembers = memberCount ?? 0;

  const typeColors: Record<string, string> = {
    house: "text-blue-400 bg-blue-950/50 border-blue-800",
    form: "text-purple-400 bg-purple-950/50 border-purple-800",
    class: "text-orange-400 bg-orange-950/50 border-orange-800",
    subject: "text-green-400 bg-green-950/50 border-green-800",
    sba: "text-amber-400 bg-amber-950/50 border-amber-800",
    club: "text-pink-400 bg-pink-950/50 border-pink-800",
    sport: "text-red-400 bg-red-950/50 border-red-800",
    general: "text-zinc-400 bg-zinc-800/50 border-zinc-700",
  };
  const typeColor = typeColors[(group as Group).type] || typeColors.general;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Group header */}
        <div className="mb-6 card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${typeColor}`}>
                  {(group as Group).type}
                </span>
                {(group as Group).is_private && <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-400">Private</span>}
              </div>
              <h1 className="text-2xl font-black">{(group as Group).name}</h1>
              {(group as Group).description && <p className="text-sm text-zinc-400 mt-1">{(group as Group).description}</p>}
              <p className="text-xs text-zinc-500 mt-2">{totalMembers} members</p>
            </div>
            <GroupFeed
              groupId={id}
              profileId={user.id}
              profile={profile as Profile}
              initialPosts={posts ?? []}
              isMember={isMember}
              isHeaderButtons={true}
            />
          </div>
        </div>

        {/* Feed */}
        <GroupFeed
          groupId={id}
          profileId={user.id}
          profile={profile as Profile}
          initialPosts={posts ?? []}
          isMember={isMember}
          isHeaderButtons={false}
        />
      </main>
    </div>
  );
}
