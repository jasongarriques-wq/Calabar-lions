export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";
import { createDocument, deleteDocument } from "../actions";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const { data: notes } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .eq("kind", "note")
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/tools" className="text-xs text-zinc-500 hover:text-zinc-300">← Lion Tools</Link>
            <h1 className="mt-1 text-2xl font-black">📓 Lion Notes</h1>
            <p className="text-sm text-zinc-400">{notes?.length ?? 0} note{notes?.length !== 1 ? "s" : ""}</p>
          </div>
          <form action={createDocument.bind(null, "note")}>
            <button type="submit" className="btn-primary">+ New Note</button>
          </form>
        </div>

        {notes && notes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => {
              const preview = (note.body ?? "").replace(/<[^>]*>/g, "").slice(0, 100);
              return (
                <div key={note.id} className="card group relative flex flex-col gap-2 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/tools/notes/${note.id}`} className="flex-1">
                      <h3 className="font-black text-white group-hover:text-green-400 transition-colors line-clamp-1">
                        {note.title || "Untitled"}
                      </h3>
                    </Link>
                    <form action={deleteDocument.bind(null, note.id)}>
                      <button type="submit" className="text-xs text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        ✕
                      </button>
                    </form>
                  </div>
                  {note.subject && (
                    <span className="w-fit rounded-full bg-green-950/50 px-2 py-0.5 text-xs font-semibold text-green-400">
                      {note.subject}
                    </span>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-500 line-clamp-3">
                    {preview || "Empty note"}
                  </p>
                  <p className="mt-auto text-[10px] text-zinc-700">
                    {new Date(note.updated_at).toLocaleDateString("en-JM", { month: "short", day: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 py-16 text-center">
            <span className="text-5xl">📓</span>
            <h3 className="mt-4 text-lg font-black">No notes yet</h3>
            <p className="mt-1 text-sm text-zinc-500">Capture your first note.</p>
            <form action={createDocument.bind(null, "note")} className="mt-4">
              <button type="submit" className="btn-primary">+ New Note</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
