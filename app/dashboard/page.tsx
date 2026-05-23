export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import SBAProgressCard from "@/components/sba-progress-card";
import GroupCard from "@/components/group-card";
import type { Profile, SBAProject, Group, Post } from "@/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const [{ data: sbas }, { data: groupMembers }, { data: posts }] = await Promise.all([
    supabase.from("sba_projects").select("*, subjects(*)").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("group_members").select("groups(*)").eq("profile_id", profile.id).limit(4),
    supabase.from("posts").select("*, profiles(*)").order("created_at", { ascending: false }).limit(5),
  ]);

  const groups = groupMembers?.map((m: any) => m.groups).filter(Boolean) as Group[] ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Welcome banner */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-green-900/50 bg-gradient-to-r from-green-950 to-zinc-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-green-400 font-semibold">Welcome back 🦁</p>
              <h1 className="text-2xl font-black">{profile.full_name ?? profile.display_name ?? "Lion"}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {profile.form && `Form ${profile.form} · `}{profile.academic_year} · {String(profile.role).replace("_", " ")}
              </p>
            </div>
            <Link href={`/profile/${profile.id}`} className="btn-secondary shrink-0">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* ── LION TOOLS QUICK ACCESS ── */}
        <div className="mb-6 card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-black">🛠️ Lion Tools</h2>
              <p className="text-xs text-zinc-500">Your workspace</p>
            </div>
            <Link href="/tools" className="text-xs text-green-400 hover:text-green-300">View all</Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { href: "/tools/docs", icon: "📝", label: "Docs" },
              { href: "/tools/notes", icon: "📓", label: "Notes" },
              { href: "/tools/sheets", icon: "📊", label: "Sheets" },
              { href: "/tools/slides", icon: "📽️", label: "Slides" },
              { href: "/tools/sba", icon: "🗂️", label: "SBA" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex flex-1 min-w-[80px] flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-center hover:border-green-800 hover:bg-green-950/20 transition-all"
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-[10px] font-black text-zinc-400">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main feed */}
          <div className="space-y-5">
            {/* Post composer */}
            <div className="card flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 font-black">
                {(profile.full_name ?? profile.display_name ?? "L")[0]}
              </div>
              <Link href="/posts/new" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-500 hover:border-green-700 transition-colors">
                Share something with the pride...
              </Link>
            </div>

            {/* Posts feed */}
            <div className="space-y-4">
              {posts?.map((post: any) => (
                <article key={post.id} className="card space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-700 to-zinc-800 font-black text-sm">
                        {post.profiles?.full_name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-black">{post.profiles?.full_name}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(post.created_at).toLocaleDateString("en-JM", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-zinc-200">{post.content}</p>
                  <div className="flex gap-4 border-t border-zinc-800 pt-3 text-sm text-zinc-500">
                    <button className="hover:text-green-400 transition-colors">❤️ {post.likes_count}</button>
                    <button className="hover:text-blue-400 transition-colors">💬 {post.comments_count}</button>
                    <button className="hover:text-yellow-400 transition-colors">🔖 {post.saves_count}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* SBA tracker */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black">📊 My SBAs</h2>
                <Link href="/sba" className="text-xs text-green-400 hover:text-green-300">View all</Link>
              </div>
              {sbas && sbas.length > 0 ? (
                <div className="space-y-3">
                  {(sbas as SBAProject[]).map(sba => <SBAProgressCard key={sba.id} sba={sba} />)}
                </div>
              ) : (
                <div className="card text-center">
                  <p className="text-sm text-zinc-500">No SBA projects yet</p>
                  <Link href="/sba/new" className="btn-primary mt-3 inline-block text-xs">+ Add SBA</Link>
                </div>
              )}
            </div>

            {/* My Groups */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black">👥 My Groups</h2>
                <Link href="/groups" className="text-xs text-green-400 hover:text-green-300">Browse all</Link>
              </div>
              {groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.map(g => <GroupCard key={g.id} group={g} />)}
                </div>
              ) : (
                <div className="card text-center">
                  <p className="text-sm text-zinc-500">You haven&apos;t joined any groups</p>
                  <Link href="/groups" className="btn-primary mt-3 inline-block text-xs">Find Groups</Link>
                </div>
              )}
            </div>

            {/* Houses quick link */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black">🏛️ Houses</h2>
                <Link href="/houses" className="text-xs text-green-400 hover:text-green-300">View all</Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Manning", color: "from-blue-900", emoji: "🔵" },
                  { name: "Dacosta", color: "from-red-900", emoji: "🔴" },
                  { name: "Lowe", color: "from-yellow-900", emoji: "🟡" },
                  { name: "Ashenheim", color: "from-green-900", emoji: "🟢" },
                ].map(h => (
                  <Link key={h.name} href="/houses"
                    className={`rounded-xl border border-zinc-800 bg-gradient-to-br ${h.color} to-zinc-900 p-3 text-sm font-semibold hover:scale-[1.02] transition-transform`}>
                    <span className="text-xl block mb-1">{h.emoji}</span>
                    {h.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mentorship quick link */}
            <div className="card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                <div className="flex-1">
                  <h2 className="font-black text-sm">Old Boys Network</h2>
                  <p className="text-xs text-zinc-500">Connect with Calabar alumni mentors</p>
                </div>
                <Link href="/mentorship" className="btn-secondary text-xs shrink-0">Browse</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
