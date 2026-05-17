import Link from "next/link";
import { Plus, NotebookText } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createDocument, deleteDocument } from "../actions";

export const metadata = { title: "Lion Notes" };

type NoteRow = {
  id: string;
  title: string;
  body: string;
  subject: string | null;
  updated_at: string;
};

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("documents")
    .select("id, title, body, subject, updated_at")
    .eq("owner_id", user?.id ?? "")
    .eq("kind", "note")
    .order("updated_at", { ascending: false })
    .limit(100);
  const notes = (data as NoteRow[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lion Notes</h1>
            <p className="mt-1 text-stone-600">Quick captures and study notes, synced to your account.</p>
          </div>
          <form action={createDocument.bind(null, "note")}>
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              New note
            </button>
          </form>
        </div>

        {notes.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <NotebookText className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No notes yet. Tap <em>New note</em> to start.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <li key={n.id} className="card flex flex-col">
                <Link href={`/tools/notes/${n.id}`} className="block">
                  <h3 className="font-semibold">{n.title || "Untitled"}</h3>
                  {n.subject && (
                    <span className="pill mt-1 bg-calabar-gold-100 text-calabar-gold-800">
                      {n.subject}
                    </span>
                  )}
                  <p className="mt-3 line-clamp-3 text-sm text-stone-600">
                    {n.body || <span className="italic text-stone-400">Empty note</span>}
                  </p>
                  <p className="mt-3 text-xs text-stone-400">
                    {new Date(n.updated_at).toLocaleString()}
                  </p>
                </Link>
                <form
                  action={deleteDocument.bind(null, n.id)}
                  className="mt-3 self-end"
                >
                  <button type="submit" className="text-xs text-red-700 hover:underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
