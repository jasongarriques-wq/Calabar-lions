"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  kind: string;
  payload: { title?: string; body?: string; href?: string } | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read_at).length;

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, payload, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setItems((data as Notification[]) ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
    });
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: now })));
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read_at: now })
        .is("read_at", null);
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white hover:bg-stone-50"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-stone-700" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-calabar-green-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 divide-y divide-stone-100 overflow-y-auto">
            {!loaded && (
              <p className="p-4 text-sm text-stone-500">Loading…</p>
            )}
            {loaded && items.length === 0 && (
              <p className="p-4 text-sm text-stone-500">You&rsquo;re all caught up.</p>
            )}
            {items.map((n) => {
              const title = n.payload?.title ?? formatKind(n.kind);
              const body = n.payload?.body;
              const inner = (
                <div className={n.read_at ? "opacity-60" : ""}>
                  <p className="text-sm font-medium">{title}</p>
                  {body && <p className="mt-0.5 text-xs text-stone-600">{body}</p>}
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              );
              return n.payload?.href ? (
                <Link
                  key={n.id}
                  href={n.payload.href}
                  onClick={() => markRead(n.id)}
                  className="block px-4 py-3 hover:bg-stone-50"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="block w-full px-4 py-3 text-left hover:bg-stone-50"
                >
                  {inner}
                </button>
              );
            })}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-stone-100 px-4 py-2 text-center text-xs font-semibold text-calabar-green-700 hover:bg-stone-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

function formatKind(kind: string) {
  return kind.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
