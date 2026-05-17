import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { DocEditor } from "./doc-editor";

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, title, body, kind")
    .eq("id", id)
    .eq("kind", "doc")
    .maybeSingle<{ id: string; title: string; body: string; kind: string }>();
  if (!data) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/tools/docs" className="text-sm text-calabar-green-700 hover:underline">
          ← All documents
        </Link>
        <DocEditor id={data.id} initialTitle={data.title} initialBody={data.body} />
      </section>
    </main>
  );
}
