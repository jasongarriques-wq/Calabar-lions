"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { useRouter } from "next/navigation";

interface GroupFeedProps {
  groupId: string;
  profileId: string;
  profile: Profile;
  initialPosts: any[];
  isMember: boolean;
  isHeaderButtons: boolean;
}

export default function GroupFeed({ groupId, profileId, profile, initialPosts, isMember: initialIsMember, isHeaderButtons }: GroupFeedProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [isMember, setIsMember] = useState(initialIsMember);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`group-feed-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts", filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const { data } = await supabase.from("posts").select("*, profiles(*)").eq("id", payload.new.id).single();
          if (data) setPosts(prev => [data, ...prev]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, supabase]);

  async function handleJoin() {
    setJoining(true);
    await supabase.from("group_members").upsert({ group_id: groupId, profile_id: profileId, role: "member" }, { onConflict: "group_id,profile_id" });
    setIsMember(true);
    setJoining(false);
    router.refresh();
  }

  async function handleLeave() {
    setJoining(true);
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("profile_id", profileId);
    setIsMember(false);
    setJoining(false);
    router.refresh();
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    await supabase.from("posts").insert({ group_id: groupId, author_id: profileId, content: content.trim() });
    setContent("");
    setPosting(false);
  }

  if (isHeaderButtons) {
    return (
      <div className="shrink-0">
        {isMember ? (
          <button onClick={handleLeave} disabled={joining}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-50">
            {joining ? "..." : "Leave"}
          </button>
        ) : (
          <button onClick={handleJoin} disabled={joining}
            className="btn-primary disabled:opacity-50">
            {joining ? "Joining..." : "Join Group"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Post composer */}
      {isMember && (
        <form onSubmit={handlePost} className="card flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 font-black text-sm">
            {(profile.full_name ?? profile.display_name ?? "L")[0]}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              className="input min-h-[80px] resize-none text-sm"
              placeholder="Share something with the group..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="flex justify-end">
              <button type="submit" disabled={posting || !content.trim()} className="btn-primary text-sm disabled:opacity-50">
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}

      {!isMember && (
        <div className="card text-center py-6 border-dashed">
          <p className="text-zinc-500 text-sm">Join this group to post and interact with members.</p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post: any) => (
          <article key={post.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-700 to-zinc-800 font-black text-sm">
                {post.profiles?.full_name?.[0] ?? "?"}
              </div>
              <div>
                <p className="text-sm font-black">{post.profiles?.full_name ?? "Unknown"}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(post.created_at).toLocaleDateString("en-JM", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-zinc-200">{post.content}</p>
            <div className="flex gap-4 border-t border-zinc-800 pt-3 text-sm text-zinc-500">
              <button className="hover:text-green-400 transition-colors">❤️ {post.likes_count ?? 0}</button>
              <button className="hover:text-blue-400 transition-colors">💬 {post.comments_count ?? 0}</button>
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-black">No posts yet</p>
            <p className="text-sm text-zinc-500 mt-1">{isMember ? "Be the first to post in this group!" : "Join the group to see and create posts."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
