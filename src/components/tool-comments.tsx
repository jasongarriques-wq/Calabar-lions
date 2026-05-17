"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ToolCommentKind = "doc" | "sheet" | "slides" | "sba";

export type ToolComment = {
  id: string;
  body: string;
  author_id: string;
  resolved: boolean;
  created_at: string;
  author_name: string;
  author_role: string;
};

type Row = {
  id: string;
  body: string;
  author_id: string;
  resolved: boolean;
  created_at: string;
  author:
    | { display_name: string | null; full_name: string | null; role: string | null }[]
    | { display_name: string | null; full_name: string | null; role: string | null }
    | null;
};

function flattenAuthor(a: Row["author"]) {
  const obj = Array.isArray(a) ? a[0] : a;
  return {
    name: obj?.display_name ?? obj?.full_name ?? "Unknown",
    role: obj?.role ?? "student",
  };
}

export function ToolComments({
  targetKind,
  targetId,
  currentUserId,
  isStaff,
}: {
  targetKind: ToolCommentKind;
  targetId: string;
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const [comments, setComments] = useState<ToolComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    (async () => {
      const { data } = await supabase
        .from("tool_comments")
        .select(
          "id, body, author_id, resolved, created_at, author:profiles!tool_comments_author_id_fkey(display_name, full_name, role)",
        )
        .eq("target_kind", targetKind)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });
      if (!active) return;
      const rows = ((data as Row[] | null) ?? []).map((r) => {
        const a = flattenAuthor(r.author);
        return {
          id: r.id,
          body: r.body,
          author_id: r.author_id,
          resolved: r.resolved,
          created_at: r.created_at,
          author_name: a.name,
          author_role: a.role,
        };
      });
      setComments(rows);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`tool-comments:${targetKind}:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tool_comments",
          filter: `target_id=eq.${targetId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            author_id: string;
            resolved: boolean;
            created_at: string;
            target_kind: string;
          };
          if (row.target_kind !== targetKind) return;
          const { data } = await supabase
            .from("profiles")
            .select("display_name, full_name, role")
            .eq("id", row.author_id)
            .maybeSingle<{
              display_name: string | null;
              full_name: string | null;
              role: string | null;
            }>();
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                body: row.body,
                author_id: row.author_id,
                resolved: row.resolved,
                created_at: row.created_at,
                author_name: data?.display_name ?? data?.full_name ?? "Unknown",
                author_role: data?.role ?? "student",
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tool_comments",
          filter: `target_id=eq.${targetId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; resolved: boolean; body: string };
          setComments((prev) =>
            prev.map((c) =>
              c.id === row.id ? { ...c, resolved: row.resolved, body: row.body } : c,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tool_comments",
          filter: `target_id=eq.${targetId}`,
        },
        (payload) => {
          const row = payload.old as { id: string };
          setComments((prev) => prev.filter((c) => c.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [targetKind, targetId]);

  async function postComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("tool_comments").insert({
      target_kind: targetKind,
      target_id: targetId,
      author_id: currentUserId,
      body: body.trim(),
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
  }

  async function toggleResolved(c: ToolComment) {
    const supabase = createClient();
    await supabase
      .from("tool_comments")
      .update({ resolved: !c.resolved })
      .eq("id", c.id);
  }

  async function remove(c: ToolComment) {
    if (!confirm("Delete this comment?")) return;
    const supabase = createClient();
    await supabase.from("tool_comments").delete().eq("id", c.id);
  }

  const open = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);

  return (
    <aside className="card sticky top-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-calabar-green-700" />
        <h2 className="font-semibold">Review &amp; comments</h2>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Teachers and the author can comment here. Updates appear in real time.
      </p>

      <div className="mt-4 space-y-3">
        {!loaded && <p className="text-sm text-stone-500">Loading…</p>}
        {loaded && open.length === 0 && (
          <p className="text-sm text-stone-500">No open comments.</p>
        )}
        {open.map((c) => (
          <CommentBubble
            key={c.id}
            c={c}
            canModerate={isStaff || c.author_id === currentUserId}
            onToggle={() => toggleResolved(c)}
            onDelete={() => remove(c)}
          />
        ))}
      </div>

      {resolved.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-stone-500">
            Resolved ({resolved.length})
          </summary>
          <div className="mt-2 space-y-3">
            {resolved.map((c) => (
              <CommentBubble
                key={c.id}
                c={c}
                canModerate={isStaff || c.author_id === currentUserId}
                onToggle={() => toggleResolved(c)}
                onDelete={() => remove(c)}
              />
            ))}
          </div>
        </details>
      )}

      <form onSubmit={postComment} className="mt-5 space-y-2 border-t border-stone-100 pt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={
            isStaff ? "Leave a comment for the student…" : "Reply to your teacher…"
          }
          className="input resize-none"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="btn-primary w-full justify-center text-sm disabled:opacity-60"
        >
          {pending ? "Posting…" : "Comment"}
        </button>
      </form>
    </aside>
  );
}

function CommentBubble({
  c,
  canModerate,
  onToggle,
  onDelete,
}: {
  c: ToolComment;
  canModerate: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isStaff = c.author_role === "teacher" || c.author_role === "admin";
  return (
    <div
      className={`rounded-xl border p-3 ${
        c.resolved
          ? "border-stone-200 bg-stone-50 opacity-70"
          : isStaff
            ? "border-calabar-gold-200 bg-calabar-gold-50"
            : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs">
          <span className="font-semibold">{c.author_name}</span>
          {isStaff && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-calabar-gold-700">
              Teacher
            </span>
          )}
        </p>
        {c.resolved && <CheckCircle2 className="h-4 w-4 text-calabar-green-700" />}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
        <span>{new Date(c.created_at).toLocaleString()}</span>
        {canModerate && (
          <div className="flex gap-2">
            <button onClick={onToggle} className="hover:underline">
              {c.resolved ? "Reopen" : "Resolve"}
            </button>
            <button onClick={onDelete} className="text-red-700 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
