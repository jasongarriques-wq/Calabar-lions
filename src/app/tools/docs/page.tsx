import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createDocument, deleteDocument } from "../actions";

export const metadata = { title: "Lion Docs" };

type DocRow = {
  id: string;
  title: string;
  body: string;
  updated_at: string;
};

export default async function DocsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("documents")
    .select("id, title, body, updated_at")
    .eq("owner_id", user?.id ?? "")
    .eq("kind", "doc")
    .order("updated_at", { ascending: false })
    .limit(100);
  const docs = (data as DocRow[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lion Docs</h1>
            <p className="mt-1 text-stone-600">Essays, reports, and long-form writing.</p>
          </div>
          <form action={createDocument.bind(null, "doc")}>
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              New document
            </button>
          </form>
        </div>

        {docs.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No documents yet.</p>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4 hover:bg-stone-50">
                <Link href={`/tools/docs/${d.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.title || "Untitled"}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {(d.body || "Empty document").slice(0, 80)}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Edited {new Date(d.updated_at).toLocaleString()}
                  </p>
                </Link>
                <form action={deleteDocument.bind(null, d.id)}>
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
