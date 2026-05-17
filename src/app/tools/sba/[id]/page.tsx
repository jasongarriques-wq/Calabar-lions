import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ToolComments } from "@/components/tool-comments";
import { createClient } from "@/lib/supabase/server";
import { SbaProjectEditor } from "./sba-project-editor";

type Project = {
  id: string;
  title: string;
  subject: string;
  status: string | null;
  percent_complete: number | null;
  due_date: string | null;
  notes: string | null;
  document_id: string | null;
  spreadsheet_id: string | null;
  slide_deck_id: string | null;
};

export default async function SbaProjectDetailPage({
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
      .from("sba_projects")
      .select(
        "id, title, subject, status, percent_complete, due_date, notes, document_id, spreadsheet_id, slide_deck_id",
      )
      .eq("id", id)
      .maybeSingle<Project>(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle<{ role: string | null }>(),
  ]);

  if (!data) notFound();
  const isStaff = me?.role === "admin" || me?.role === "teacher";

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/tools/sba" className="text-sm text-calabar-green-700 hover:underline">
          ← All SBA projects
        </Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <SbaProjectEditor project={data} />
          <ToolComments
            targetKind="sba"
            targetId={data.id}
            currentUserId={user?.id ?? null}
            isStaff={isStaff}
          />
        </div>
      </section>
    </main>
  );
}
