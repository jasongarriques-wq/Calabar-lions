export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";
import { createDocument, deleteDocument } from "../actions";

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-800 text-zinc-300",
  submitted: "bg-amber-950/60 text-amber-400 border border-amber-800/50",
  reviewed: "bg-green-950/60 text-green-400 border border-green-800/50",
};

export default async function DocsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .eq("kind", "doc")
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/tools" className="text-xs text-zinc-500 hover:text-zinc-300">← Lion Tools</Link>
            <h1 className="mt-1 text-2xl font-black">📝 Lion Docs</h1>
            <p className="text-sm text-zinc-400">{docs?.length ?? 0} document{docs?.length !== 1 ? "s" : ""}</p>
          </div>
          <form action={createDocument.bind(null, "doc")}>
            <button type="submit" className="btn-primary">+ New Document</button>
          </form>
        </div>

        {docs && docs.length > 0 ? (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500">Title</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500 sm:table-cell">Subject</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500 md:table-cell">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500 lg:table-cell">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tools/docs/${doc.id}`} className="font-semibold text-white hover:text-green-400 transition-colors">
                        {doc.title || "Untitled"}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                      {doc.subject || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[doc.status] ?? statusStyles.draft}`}>
                        {doc.status ?? "draft"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-500 lg:table-cell">
                      {new Date(doc.updated_at).toLocaleDateString("en-JM", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteDocument.bind(null, doc.id)}>
                        <button type="submit" className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 py-16 text-center">
            <span className="text-5xl">📝</span>
            <h3 className="mt-4 text-lg font-black">No documents yet</h3>
            <p className="mt-1 text-sm text-zinc-500">Create your first document to get started.</p>
            <form action={createDocument.bind(null, "doc")} className="mt-4">
              <button type="submit" className="btn-primary">+ New Document</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
