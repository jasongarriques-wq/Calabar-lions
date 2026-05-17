"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CommentThread } from "./comment-thread";

export type GroupPost = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
};

type Props = {
  groupId: string;
  initialPosts: GroupPost[];
  isMember: boolean;
  currentUserId: string | null;
};

export function GroupFeed({ groupId, initialPosts, isMember, currentUserId }: Props) {
  const [posts, setPosts] = useState<GroupPost[]>(initialPosts);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`posts:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; body: string; created_at: string; author_id: string };
          if (posts.some((p) => p.id === row.id)) return;
          const { data } = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", row.author_id)
            .maybeSingle<{ display_name: string | null; full_name: string | null }>();
          setPosts((prev) => [
            {
              id: row.id,
              body: row.body,
              created_at: row.created_at,
              author_id: row.author_id,
              author_name: data?.display_name ?? data?.full_name ?? "Unknown",
            },
            ...prev,
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const row = payload.old as { id: string };
          setPosts((prev) => prev.filter((p) => p.id !== row.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .insert({ group_id: groupId, body: body.trim(), author_id: currentUserId });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) alert(error.message);
  }

  return (
    <div>
      {isMember ? (
        <form onSubmit={onSubmit} className="card">
          <label htmlFor="body" className="label">
            Post to the group
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share something with the group…"
            className="input resize-none"
          />
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="btn-primary disabled:opacity-60"
            >
              {pending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="card text-sm text-stone-600">
          Join this group to post and see real-time updates.
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {posts.length === 0 && (
          <li className="card text-sm text-stone-500">No posts yet. Be the first.</li>
        )}
        {posts.map((p) => (
          <li key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-calabar-green-700 text-sm font-bold text-white">
                  {p.author_name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{p.author_name}</p>
                  <p className="text-xs text-stone-500">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {p.author_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => deletePost(p.id)}
                  className="text-xs text-red-700 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.body}</p>

            <div className="mt-3 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() =>
                  setExpanded((m) => ({ ...m, [p.id]: !m[p.id] }))
                }
                className="text-xs font-semibold text-calabar-green-700 hover:underline"
              >
                {expanded[p.id] ? "Hide comments" : "Comments"}
              </button>
              {expanded[p.id] && (
                <CommentThread
                  postId={p.id}
                  currentUserId={currentUserId}
                  canComment={isMember}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
