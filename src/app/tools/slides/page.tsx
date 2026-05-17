import Link from "next/link";
import { Plus, MonitorPlay } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createSlideDeck, deleteSlideDeck } from "../actions";

export const metadata = { title: "Lion Slides" };

type Deck = {
  id: string;
  title: string;
  slides: { title?: string; body?: string }[];
  updated_at: string;
};

export default async function SlidesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("slide_decks")
    .select("id, title, slides, updated_at")
    .eq("owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(100);
  const decks = (data as Deck[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lion Slides</h1>
            <p className="mt-1 text-stone-600">SBA decks, class presentations, and pitch slides.</p>
          </div>
          <form action={createSlideDeck}>
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              New deck
            </button>
          </form>
        </div>

        {decks.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <MonitorPlay className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No decks yet.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <li key={d.id} className="card flex flex-col">
                <Link href={`/tools/slides/${d.id}`} className="block">
                  <MonitorPlay className="h-6 w-6 text-calabar-green-700" />
                  <p className="mt-3 font-semibold">{d.title || "Untitled"}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {Array.isArray(d.slides) ? d.slides.length : 0} slides
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(d.updated_at).toLocaleString()}
                  </p>
                </Link>
                <form action={deleteSlideDeck.bind(null, d.id)} className="mt-3 self-end">
                  <button type="submit" className="text-xs text-red-700 hover:underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
