"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
};

export function CommentThread({
  postId,
  currentUserId,
  canComment,
}: {
  postId: string;
  currentUserId: string | null;
  canComment: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    (async () => {
      const { data } = await supabase
        .from("comments")
        .select(
          "id, body, created_at, author_id, author:profiles!comments_author_id_fkey(display_name, full_name)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!active) return;
      type Row = {
        id: string;
        body: string;
        created_at: string;
        author_id: string;
        author?:
          | { display_name: string | null; full_name: string | null }[]
          | { display_name: string | null; full_name: string | null }
          | null;
      };
      const mapped = ((data as Row[] | null) ?? []).map((c) => {
        const a = Array.isArray(c.author) ? c.author[0] : c.author;
        return {
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          author_id: c.author_id,
          author_name: a?.display_name ?? a?.full_name ?? "Unknown",
        };
      });
      setComments(mapped);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            author_id: string;
          };
          if (comments.some((c) => c.id === row.id)) return;
          const { data } = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", row.author_id)
            .maybeSingle<{ display_name: string | null; full_name: string | null }>();
          setComments((prev) => [
            ...prev,
            {
              id: row.id,
              body: row.body,
              created_at: row.created_at,
              author_id: row.author_id,
              author_name: data?.display_name ?? data?.full_name ?? "Unknown",
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: postId, body: body.trim(), author_id: currentUserId });
    setPending(false);
    if (error) {
      alert(error.message);
      return;
    }
    setBody("");
  }

  return (
    <div className="mt-3 space-y-3">
      {!loaded && <p className="text-xs text-stone-500">Loading…</p>}
      {loaded && comments.length === 0 && (
        <p className="text-xs text-stone-500">No comments yet.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs">
            <span className="font-semibold">{c.author_name}</span>
            <span className="ml-2 text-stone-500">
              {new Date(c.created_at).toLocaleString()}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
        </div>
      ))}

      {canComment && (
        <form onSubmit={onSubmit} className="flex items-start gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            placeholder="Reply…"
            className="input min-h-9 flex-1 resize-y"
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="btn-primary disabled:opacity-60"
          >
            Reply
          </button>
        </form>
      )}
    </div>
  );
}
