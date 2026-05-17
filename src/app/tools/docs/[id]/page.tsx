import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ToolComments } from "@/components/tool-comments";
import { PresenceBar } from "@/components/presence-bar";
import { createClient } from "@/lib/supabase/server";
import { DocEditor } from "./doc-editor";

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: me }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, body, kind, owner_id")
      .eq("id", id)
      .eq("kind", "doc")
      .maybeSingle<{ id: string; title: string; body: string; kind: string; owner_id: string }>(),
    supabase
      .from("profiles")
      .select("display_name, full_name, role")
      .eq("id", user?.id ?? "")
      .maybeSingle<{ display_name: string | null; full_name: string | null; role: string | null }>(),
  ]);

  if (!data) notFound();
  const isStaff = me?.role === "admin" || me?.role === "teacher";

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/tools/docs" className="text-sm text-calabar-green-700 hover:underline">
            ← All documents
          </Link>
          <PresenceBar
            topic={`doc:${data.id}`}
            currentUserId={user?.id ?? null}
            currentUserName={me?.display_name ?? me?.full_name ?? "Lion"}
            currentUserRole={me?.role ?? "student"}
          />
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <DocEditor id={data.id} initialTitle={data.title} initialBody={data.body} />
          <ToolComments
            targetKind="doc"
            targetId={data.id}
            currentUserId={user?.id ?? null}
            isStaff={isStaff}
          />
        </div>
      </section>
    </main>
  );
}
