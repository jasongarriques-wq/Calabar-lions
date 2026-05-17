import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { SlideEditor, type Slide } from "./slide-editor";

export default async function SlideDeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("slide_decks")
    .select("id, title, slides")
    .eq("id", id)
    .maybeSingle<{ id: string; title: string; slides: Slide[] }>();
  if (!data) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-6">
        <Link href="/tools/slides" className="text-sm text-calabar-green-700 hover:underline">
          ← All decks
        </Link>
        <SlideEditor
          id={data.id}
          initialTitle={data.title}
          initialSlides={Array.isArray(data.slides) ? data.slides : []}
        />
      </section>
    </main>
  );
}
