import Link from "next/link";
import { Plus, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createDocument, deleteDocument } from "../actions";

export const metadata = { title: "Lion Docs" };

type DocRow = {
  id: string;
  title: string;
  body: string;
  subject: string | null;
  status: "draft" | "submitted" | "reviewed" | null;
  updated_at: string;
};

type Profile = {
  class_group: string | null;
  form: string | null;
};

export default async function DocsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: docsData }, { data: profile }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, body, subject, status, updated_at")
      .eq("owner_id", user?.id ?? "")
      .eq("kind", "doc")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("class_group, form")
      .eq("id", user?.id ?? "")
      .maybeSingle<Profile>(),
  ]);

  const docs = (docsData as DocRow[] | null) ?? [];
  const fallbackClass = profile?.class_group ?? (profile?.form ? `Form ${profile.form}` : "—");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lion Docs</h1>
            <p className="mt-1 text-stone-600">
              Write like a Lion. Submit with pride. &mdash; Essays, SBAs, and class assignments.
            </p>
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
          <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Subject</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Class</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link href={`/tools/docs/${d.id}`} className="block">
                        <p className="font-semibold">{d.title || "Untitled"}</p>
                        <p className="mt-0.5 truncate text-xs text-stone-500 sm:hidden">
                          {d.subject ?? "—"}
                        </p>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                      {d.subject ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 md:table-cell">
                      {fallbackClass}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status ?? "draft"} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-stone-500 lg:table-cell">
                      {new Date(d.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteDocument.bind(null, d.id)} className="inline">
                        <button type="submit" className="text-xs text-red-700 hover:underline">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: "draft" | "submitted" | "reviewed" }) {
  const map = {
    draft: { label: "Draft", cls: "bg-stone-100 text-stone-700", Icon: Clock },
    submitted: { label: "Submitted", cls: "bg-calabar-gold-100 text-calabar-gold-800", Icon: Eye },
    reviewed: {
      label: "Reviewed",
      cls: "bg-calabar-green-50 text-calabar-green-800",
      Icon: CheckCircle2,
    },
  } as const;
  const { label, cls, Icon } = map[status];
  return (
    <span className={`pill ${cls}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </span>
  );
}
