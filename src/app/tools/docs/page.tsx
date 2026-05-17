import Link from "next/link";
import { Plus, FileText, CheckCircle2, Clock, Eye, Users } from "lucide-react";
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

type SharedRow = {
  document_id: string;
  can_edit: boolean;
  document: {
    id: string;
    title: string;
    subject: string | null;
    status: "draft" | "submitted" | "reviewed" | null;
    updated_at: string;
    owner: { display_name: string | null; full_name: string | null } | null;
  } | null;
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

  const [{ data: docsData }, { data: profile }, { data: sharedData }] = await Promise.all([
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
    supabase
      .from("document_shares")
      .select(
        "document_id, can_edit, document:documents!document_shares_document_id_fkey(id, title, subject, status, updated_at, owner:profiles!documents_owner_id_fkey(display_name, full_name))",
      )
      .eq("shared_with_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const docs = (docsData as DocRow[] | null) ?? [];
  const sharedRaw = (sharedData as unknown as Array<{
    document_id: string;
    can_edit: boolean;
    document:
      | SharedRow["document"]
      | NonNullable<SharedRow["document"]>[]
      | null;
  }> | null) ?? [];
  const shared: Array<NonNullable<SharedRow["document"]> & { can_edit: boolean }> = sharedRaw
    .map((r) => {
      const doc = Array.isArray(r.document) ? r.document[0] : r.document;
      if (!doc) return null;
      const owner = Array.isArray(doc.owner) ? doc.owner[0] : doc.owner;
      return { ...doc, owner, can_edit: r.can_edit };
    })
    .filter(Boolean) as Array<NonNullable<SharedRow["document"]> & { can_edit: boolean }>;

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

        <h2 className="mt-10 font-display text-xl font-bold">My documents</h2>
        {docs.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No documents yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white">
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

        {shared.length > 0 && (
          <>
            <h2 className="mt-10 flex items-center gap-2 font-display text-xl font-bold">
              <Users className="h-4 w-4 text-calabar-green-700" />
              Shared with me
            </h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3 font-semibold">Document</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Shared by</th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Subject</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {shared.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <Link href={`/tools/docs/${d.id}`} className="block font-semibold">
                          {d.title || "Untitled"}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                        {d.owner?.display_name ?? d.owner?.full_name ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-stone-600 md:table-cell">
                        {d.subject ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`pill ${
                            d.can_edit
                              ? "bg-calabar-green-50 text-calabar-green-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {d.can_edit ? "Editor" : "Viewer"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-stone-500 lg:table-cell">
                        {new Date(d.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
