"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Share = {
  id: string;
  shared_with_id: string;
  can_edit: boolean;
  shared_with: {
    display_name: string | null;
    full_name: string | null;
    role: string | null;
    class_group: string | null;
  };
};

type PersonHit = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  class_group: string | null;
  role: string | null;
};

export function DocSharePanel({
  documentId,
  ownerId,
  currentUserId,
  canManage,
}: {
  documentId: string;
  ownerId: string;
  currentUserId: string | null;
  canManage: boolean;
}) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PersonHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("document_shares")
        .select(
          "id, shared_with_id, can_edit, shared_with:profiles!document_shares_shared_with_id_fkey(display_name, full_name, role, class_group)",
        )
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      if (!active) return;
      type Row = Omit<Share, "shared_with"> & {
        shared_with: Share["shared_with"] | Share["shared_with"][] | null;
      };
      const rows = ((data as Row[] | null) ?? []).map((r) => ({
        ...r,
        shared_with: Array.isArray(r.shared_with)
          ? r.shared_with[0]
          : (r.shared_with ?? {
              display_name: null,
              full_name: null,
              role: null,
              class_group: null,
            }),
      }));
      setShares(rows);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [documentId]);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const term = `%${query.replace(/[%_]/g, "")}%`;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, class_group, role")
        .or(
          `display_name.ilike.${term},full_name.ilike.${term},class_group.ilike.${term}`,
        )
        .limit(8);
      const filtered = ((data as PersonHit[] | null) ?? []).filter(
        (p) =>
          p.id !== ownerId && !shares.some((s) => s.shared_with_id === p.id),
      );
      setHits(filtered);
      setSearching(false);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, ownerId, shares]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function add(p: PersonHit, canEdit: boolean) {
    setOpen(false);
    setQuery("");
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("document_shares")
        .insert({
          document_id: documentId,
          shared_with_id: p.id,
          can_edit: canEdit,
        })
        .select(
          "id, shared_with_id, can_edit, shared_with:profiles!document_shares_shared_with_id_fkey(display_name, full_name, role, class_group)",
        )
        .single();
      if (error) {
        alert(error.message);
        return;
      }
      type Row = Omit<Share, "shared_with"> & {
        shared_with: Share["shared_with"] | Share["shared_with"][] | null;
      };
      const r = data as Row;
      setShares((prev) => [
        {
          ...r,
          shared_with: Array.isArray(r.shared_with)
            ? r.shared_with[0]
            : (r.shared_with ?? {
                display_name: null,
                full_name: null,
                role: null,
                class_group: null,
              }),
        },
        ...prev,
      ]);
    });
  }

  async function toggleEdit(s: Share) {
    setShares((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, can_edit: !x.can_edit } : x)),
    );
    const supabase = createClient();
    await supabase
      .from("document_shares")
      .update({ can_edit: !s.can_edit })
      .eq("id", s.id);
  }

  async function remove(s: Share) {
    if (!confirm("Remove access?")) return;
    setShares((prev) => prev.filter((x) => x.id !== s.id));
    const supabase = createClient();
    await supabase.from("document_shares").delete().eq("id", s.id);
  }

  return (
    <div ref={rootRef} className="card">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-calabar-green-700" />
        <h3 className="text-sm font-semibold">Share</h3>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {canManage
          ? "Add classmates to view or edit. They'll get a notification."
          : "Sharing is managed by the document owner."}
      </p>

      {canManage && (
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or class…"
            className="input pl-8 text-xs"
          />
          {open && query && (
            <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
              {searching && <p className="p-3 text-xs text-stone-500">Searching…</p>}
              {!searching && hits.length === 0 && (
                <p className="p-3 text-xs text-stone-500">No matches.</p>
              )}
              {hits.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {p.display_name ?? p.full_name ?? "Unnamed"}
                    </p>
                    <p className="truncate text-[10px] text-stone-500">
                      {p.class_group ?? p.role ?? ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => add(p, false)}
                      className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-semibold hover:bg-stone-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => add(p, true)}
                      className="rounded-md bg-calabar-green-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-calabar-green-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ul className="mt-3 space-y-2 text-xs">
        {!loaded && <li className="text-stone-500">Loading…</li>}
        {loaded && shares.length === 0 && (
          <li className="text-stone-500">Only you and your teachers can see this.</li>
        )}
        {shares.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-2 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {s.shared_with.display_name ?? s.shared_with.full_name ?? "Unknown"}
                {s.shared_with_id === currentUserId && (
                  <span className="ml-1 text-stone-400">(you)</span>
                )}
              </p>
              <p className="truncate text-[10px] text-stone-500">
                {s.shared_with.class_group ?? s.shared_with.role ?? ""}
              </p>
            </div>
            {canManage ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleEdit(s)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    s.can_edit
                      ? "bg-calabar-green-700 text-white"
                      : "bg-stone-100 text-stone-700"
                  }`}
                  title="Toggle edit permission"
                >
                  {s.can_edit ? "Editor" : "Viewer"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(s)}
                  className="text-stone-400 hover:text-red-700"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-stone-500">
                {s.can_edit ? "Editor" : "Viewer"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
