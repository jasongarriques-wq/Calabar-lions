import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ToolComments } from "@/components/tool-comments";
import { createClient } from "@/lib/supabase/server";
import { SlideEditor, type Slide } from "./slide-editor";

export default async function SlideDeckDetailPage({
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
      .from("slide_decks")
      .select("id, title, slides")
      .eq("id", id)
      .maybeSingle<{ id: string; title: string; slides: Slide[] }>(),
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
      <section className="mx-auto max-w-7xl px-6 py-6">
        <Link href="/tools/slides" className="text-sm text-calabar-green-700 hover:underline">
          ← All decks
        </Link>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_22rem]">
          <SlideEditor
            id={data.id}
            initialTitle={data.title}
            initialSlides={Array.isArray(data.slides) ? data.slides : []}
          />
          <ToolComments
            targetKind="slides"
            targetId={data.id}
            currentUserId={user?.id ?? null}
            isStaff={isStaff}
          />
        </div>
      </section>
    </main>
  );
}
