import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
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
  const { data } = await supabase
    .from("sba_projects")
    .select(
      "id, title, subject, status, percent_complete, due_date, notes, document_id, spreadsheet_id, slide_deck_id",
    )
    .eq("id", id)
    .maybeSingle<Project>();
  if (!data) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/tools/sba" className="text-sm text-calabar-green-700 hover:underline">
          ← All SBA projects
        </Link>
        <SbaProjectEditor project={data} />
      </section>
    </main>
  );
}
