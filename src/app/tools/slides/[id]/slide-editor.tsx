"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Presentation,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import {
  ToolShell,
  RibbonGroup,
  type ToolShellAuthor,
} from "@/components/tool-shell";

export type Slide = { title: string; body: string };

const TABS = ["File", "Home", "Insert", "Design", "Transitions", "View", "Help"];

export function SlideEditor({
  id,
  initialTitle,
  initialSlides,
  author,
  canEdit,
}: {
  id: string;
  initialTitle: string;
  initialSlides: Slide[];
  author: ToolShellAuthor;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides.length ? initialSlides : [{ title: "Welcome", body: "" }],
  );
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("Home");
  const [presenting, setPresenting] = useState(false);

  const { status } = useAutosave(
    { title, slides },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("slide_decks")
        .update({ title: v.title, slides: v.slides })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    { enabled: canEdit },
  );

  function update(i: number, patch: Partial<Slide>) {
    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSlide() {
    setSlides((prev) => [...prev, { title: `Slide ${prev.length + 1}`, body: "" }]);
    setActive(slides.length);
  }
  function removeSlide(i: number) {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, idx) => idx !== i));
    setActive((cur) => Math.max(0, Math.min(cur, slides.length - 2)));
  }

  return (
    <ToolShell
      appName="Lion Slides"
      appTagline="Present like a Lion."
      badge="Deck"
      title={title}
      setTitle={canEdit ? setTitle : undefined}
      saveStatus={status}
      author={author}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      canEdit={canEdit}
      statusItems={
        <>
          <span>
            Slide {active + 1} of {slides.length}
          </span>
        </>
      }
      rightActions={
        <button
          type="button"
          onClick={() => setPresenting(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-calabar-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-calabar-green-800"
        >
          <Play className="h-3.5 w-3.5" />
          Present
        </button>
      }
      toolbar={
        <>
          <RibbonGroup label="Slides">
            <button
              onClick={addSlide}
              disabled={!canEdit}
              className="inline-flex items-center gap-1 rounded bg-calabar-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-calabar-green-800 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> New slide
            </button>
            <button
              onClick={() => removeSlide(active)}
              disabled={!canEdit || slides.length <= 1}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </RibbonGroup>
        </>
      }
      leftPanel={
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Slides
            </h2>
            <Presentation className="h-4 w-4 text-slate-400" />
          </div>
          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {slides.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => setActive(i)}
                  className={`flex w-full items-start gap-2 rounded-lg border p-2 text-left text-xs transition ${
                    i === active
                      ? "border-calabar-green-500 bg-calabar-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-slate-100 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2 flex-1 font-medium">
                    {s.title || "Untitled slide"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      }
    >
      <div className="grid h-full min-h-0 place-items-center bg-[#c9cfdb] p-6">
        <div
          className="aspect-[16/9] w-full rounded-md bg-white p-12 shadow-[0_6px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-300"
          style={{ maxWidth: 1100 }}
        >
          <input
            value={slides[active]?.title ?? ""}
            onChange={(e) => update(active, { title: e.target.value })}
            disabled={!canEdit}
            placeholder="Slide title"
            className="w-full bg-transparent font-display text-4xl font-bold focus:outline-none disabled:opacity-90"
          />
          <textarea
            value={slides[active]?.body ?? ""}
            onChange={(e) => update(active, { body: e.target.value })}
            disabled={!canEdit}
            placeholder="Bullet points or speaker notes…"
            rows={12}
            className="mt-6 w-full resize-y bg-transparent text-lg leading-relaxed focus:outline-none disabled:opacity-90"
          />
        </div>
      </div>

      {presenting && <Presenter slides={slides} onClose={() => setPresenting(false)} />}
    </ToolShell>
  );
}

function Presenter({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") setI((c) => Math.min(c + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setI((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, onClose]);

  const s = slides[i];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-calabar-ink text-white">
      <header className="flex items-center justify-between px-6 py-3">
        <p className="text-sm text-stone-400">
          {i + 1} / {slides.length}
        </p>
        <button onClick={onClose} className="text-stone-300 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-12 text-center">
        <h2 className="font-display text-5xl font-black">{s?.title || "Untitled slide"}</h2>
        {s?.body && (
          <pre className="mt-8 max-w-3xl whitespace-pre-wrap text-left text-xl leading-relaxed text-stone-200">
            {s.body}
          </pre>
        )}
      </div>
      <footer className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setI((c) => Math.max(c - 1, 0))}
          disabled={i === 0}
          className="flex items-center gap-1 text-sm text-stone-300 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={() => setI((c) => Math.min(c + 1, slides.length - 1))}
          disabled={i === slides.length - 1}
          className="flex items-center gap-1 text-sm text-stone-300 hover:text-white disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
