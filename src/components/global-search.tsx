"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileHit = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  class_group: string | null;
  role: string | null;
};

type GroupHit = { id: string; name: string; type: string };
type ResourceHit = { id: string; title: string; subject: string; url: string };

type Results = {
  profiles: ProfileHit[];
  groups: GroupHit[];
  resources: ResourceHit[];
};

const EMPTY: Results = { profiles: [], groups: [], resources: [] };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const term = `%${query.replace(/[%_]/g, "")}%`;
      const [profiles, groups, resources] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, full_name, class_group, role")
          .or(
            `display_name.ilike.${term},full_name.ilike.${term},class_group.ilike.${term}`,
          )
          .limit(6),
        supabase
          .from("groups")
          .select("id, name, type")
          .ilike("name", term)
          .is("parent_id", null)
          .limit(6),
        supabase
          .from("resources")
          .select("id, title, subject, url")
          .or(`title.ilike.${term},subject.ilike.${term}`)
          .limit(6),
      ]);
      setResults({
        profiles: (profiles.data as ProfileHit[]) ?? [],
        groups: (groups.data as GroupHit[]) ?? [],
        resources: (resources.data as ResourceHit[]) ?? [],
      });
      setLoading(false);
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  const totalHits =
    results.profiles.length + results.groups.length + results.resources.length;

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        <input
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search students, classes, files…"
          className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-calabar-green-500 focus:outline-none focus:ring-2 focus:ring-calabar-green-200"
        />
      </div>

      {open && query && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lg">
          {loading && <p className="p-4 text-sm text-stone-500">Searching…</p>}
          {!loading && totalHits === 0 && (
            <p className="p-4 text-sm text-stone-500">No matches.</p>
          )}

          {results.profiles.length > 0 && (
            <Section title="People">
              {results.profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOpen(false)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span className="font-medium">
                    {p.display_name ?? p.full_name ?? "Unnamed"}
                  </span>
                  <span className="ml-2 text-xs text-stone-500">
                    {p.class_group ?? p.role ?? ""}
                  </span>
                </button>
              ))}
            </Section>
          )}

          {results.groups.length > 0 && (
            <Section title="Groups">
              {results.groups.map((g) => (
                <Link
                  key={g.id}
                  href="/groups"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-stone-50"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="ml-2 text-xs uppercase tracking-wider text-stone-500">
                    {g.type}
                  </span>
                </Link>
              ))}
            </Section>
          )}

          {results.resources.length > 0 && (
            <Section title="Resources">
              {results.resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-stone-50"
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="ml-2 text-xs text-stone-500">{r.subject}</span>
                </a>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-stone-100 py-2 last:border-0">
      <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {title}
      </p>
      {children}
    </div>
  );
}
