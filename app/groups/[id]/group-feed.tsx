"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { useRouter } from "next/navigation";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useVideoChat } from "@/hooks/useVideoChat";
import VideoTile from "@/components/video-tile";

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

  const myName = profile.full_name ?? profile.display_name ?? "Member";

  // ── Voice & Video hooks ────────────────────────────────────────────────────
  const voice = useVoiceChat(groupId, profileId, myName);
  const video = useVideoChat(groupId, profileId, myName);

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

      {/* ── Voice + Video panel (members only) ───────────────────────────── */}
      {isMember && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Group Call
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* ── Voice chat ──────────────────────────────────────────── */}
            <div
              className="rounded-xl border p-3 space-y-2"
              style={{
                background: voice.active ? "rgba(16,185,129,0.06)" : "#111",
                borderColor: voice.active ? "rgba(16,185,129,0.35)" : "#222",
              }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#52525b" }}>
                Voice
              </p>

              {/* Error */}
              {voice.error && (
                <p className="text-[10px] rounded-lg px-2 py-1" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {voice.error}
                </p>
              )}

              {/* Connected peers */}
              {voice.active && voice.connectedPeers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {voice.connectedPeers.map(peerId => {
                    const name = voice.peerNames[peerId] ?? peerId.slice(0, 6);
                    return (
                      <span
                        key={peerId}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                      >
                        🎤 {name.split(" ")[0]}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                {!voice.active ? (
                  <button
                    onClick={voice.join}
                    className="flex-1 rounded-xl py-2 text-xs font-black transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}
                  >
                    🎤 Join
                  </button>
                ) : (
                  <>
                    <button
                      onClick={voice.toggleMute}
                      className="flex-1 rounded-xl py-2 text-xs font-black transition-all"
                      style={{
                        background: voice.muted ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                        border: `1px solid ${voice.muted ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
                        color: voice.muted ? "#f87171" : "#10b981",
                      }}
                    >
                      {voice.muted ? "🔇 Muted" : "🎤 Live"}
                    </button>
                    <button
                      onClick={voice.leave}
                      className="rounded-xl px-3 py-2 text-xs font-black"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>

              {voice.active && voice.connectedPeers.length === 0 && (
                <p className="text-[10px] text-center" style={{ color: "#52525b" }}>
                  Waiting for others…
                </p>
              )}
            </div>

            {/* ── Video chat ──────────────────────────────────────────── */}
            <div
              className="rounded-xl border p-3 space-y-2"
              style={{
                background: video.active ? "rgba(168,85,247,0.05)" : "#111",
                borderColor: video.active ? "rgba(168,85,247,0.35)" : "#222",
              }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#52525b" }}>
                Video
              </p>

              {/* Error */}
              {video.error && (
                <p className="text-[10px] rounded-lg px-2 py-1" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {video.error}
                </p>
              )}

              {/* Video tiles */}
              {video.active && (
                <div className="space-y-1.5">
                  <VideoTile
                    stream={video.localStream}
                    label={`${myName.split(" ")[0]} (You)`}
                    mirror
                    muted
                    cameraOff={video.cameraOff}
                    size="sm"
                  />
                  {video.remoteStreams.map(rs => (
                    <VideoTile
                      key={rs.peerId}
                      stream={rs.stream}
                      label={rs.displayName.split(" ")[0]}
                      size="sm"
                    />
                  ))}
                  {video.remoteStreams.length === 0 && (
                    <p className="text-[10px] text-center" style={{ color: "#52525b" }}>
                      Waiting for others…
                    </p>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                {!video.active ? (
                  <button
                    onClick={video.join}
                    className="flex-1 rounded-xl py-2 text-xs font-black transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}
                  >
                    📹 Join
                  </button>
                ) : (
                  <>
                    <button
                      onClick={video.toggleCamera}
                      className="flex-1 rounded-xl py-2 text-xs font-black transition-all"
                      style={{
                        background: video.cameraOff ? "rgba(239,68,68,0.15)" : "rgba(168,85,247,0.15)",
                        border: `1px solid ${video.cameraOff ? "rgba(239,68,68,0.4)" : "rgba(168,85,247,0.4)"}`,
                        color: video.cameraOff ? "#f87171" : "#c084fc",
                      }}
                    >
                      {video.cameraOff ? "📷 Off" : "📹 Live"}
                    </button>
                    <button
                      onClick={video.leave}
                      className="rounded-xl px-3 py-2 text-xs font-black"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post composer ───────────────────────────────────────────────── */}
      {isMember && (
        <form onSubmit={handlePost} className="card flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 font-black text-sm">
            {myName[0]}
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
          <p className="text-zinc-500 text-sm">Join this group to post, call, and interact with members.</p>
        </div>
      )}

      {/* ── Posts ───────────────────────────────────────────────────────── */}
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
