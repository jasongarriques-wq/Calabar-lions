import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { NoteEditor } from "./note-editor";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, title, body, subject, kind, updated_at")
    .eq("id", id)
    .eq("kind", "note")
    .maybeSingle<{ id: string; title: string; body: string; subject: string | null; kind: string; updated_at: string }>();
  if (!data) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/tools/notes" className="text-sm text-calabar-green-700 hover:underline">
          ← All notes
        </Link>
        <NoteEditor
          id={data.id}
          initialTitle={data.title}
          initialBody={data.body}
          initialSubject={data.subject ?? ""}
        />
      </section>
    </main>
  );
}
