export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import SBAProgressCard from "@/components/sba-progress-card";
import type { Profile, SBAProject, Post } from "@/types";

// Route param is now the profile id (since there is no username column)
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: profileId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: currentProfile }, { data: viewedProfile }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("profiles").select("*").eq("id", profileId).single(),
  ]);

  if (!viewedProfile) notFound();

  const isOwn = currentProfile?.id === viewedProfile.id;
  const displayName = viewedProfile.full_name ?? viewedProfile.display_name ?? "Lion";

  const [{ data: sbas }, { data: posts }] = await Promise.all([
    supabase.from("sba_projects").select("*, subjects(*)").eq("student_id", viewedProfile.id).limit(3),
    supabase.from("posts").select("*").eq("author_id", viewedProfile.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={currentProfile as Profile} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Profile header */}
        <div className="card mb-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-zinc-900 text-3xl font-black">
              {displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black">{displayName}</h1>
                {viewedProfile.approved && <span title="Verified">✅</span>}
              </div>
              {viewedProfile.display_name && viewedProfile.display_name !== viewedProfile.full_name && (
                <p className="text-sm text-zinc-500">&ldquo;{viewedProfile.display_name}&rdquo;</p>
              )}
              {viewedProfile.bio && <p className="mt-2 text-sm text-zinc-300">{viewedProfile.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300 capitalize">
                  {String(viewedProfile.role).replace("_", " ")}
                </span>
                {viewedProfile.form && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">Form {viewedProfile.form}</span>
                )}
                {viewedProfile.grade && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">Grade {viewedProfile.grade}</span>
                )}
              </div>
            </div>
            {isOwn && (
              <a href="/settings" className="btn-secondary shrink-0 text-xs">Edit Profile</a>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* SBA projects */}
          {sbas && sbas.length > 0 && (
            <div>
              <h2 className="mb-3 font-black">📊 SBA Projects</h2>
              <div className="space-y-3">
                {(sbas as SBAProject[]).map(s => <SBAProgressCard key={s.id} sba={s} />)}
              </div>
            </div>
          )}

          {/* Posts */}
          <div>
            <h2 className="mb-3 font-black">📝 Posts</h2>
            <div className="space-y-3">
              {(posts as Post[] ?? []).map(p => (
                <div key={p.id} className="card">
                  <p className="text-sm leading-6 text-zinc-200">{p.content}</p>
                  <div className="mt-3 flex gap-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                    <span>❤️ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!posts || posts.length === 0) && (
                <div className="card py-8 text-center text-sm text-zinc-500">No posts yet</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
