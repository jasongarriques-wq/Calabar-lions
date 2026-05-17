"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";

export type Slide = { title: string; body: string };

export function SlideEditor({
  id,
  initialTitle,
  initialSlides,
}: {
  id: string;
  initialTitle: string;
  initialSlides: Slide[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides.length ? initialSlides : [{ title: "Welcome", body: "" }],
  );
  const [active, setActive] = useState(0);
  const [presenting, setPresenting] = useState(false);

  const { status, error } = useAutosave({ title, slides }, async (v) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("slide_decks")
      .update({ title: v.title, slides: v.slides })
      .eq("id", id);
    if (error) throw new Error(error.message);
  });

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
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deck title"
          className="w-full bg-transparent text-2xl font-bold focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <SaveStatusPill status={status} error={error} />
          <button onClick={() => setPresenting(true)} className="btn-primary text-sm">
            <Play className="h-4 w-4" />
            Present
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[14rem_1fr]">
        <ol className="space-y-2">
          {slides.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setActive(i)}
                className={`flex w-full items-start gap-2 rounded-xl border p-2 text-left text-sm transition ${
                  i === active
                    ? "border-calabar-green-500 bg-calabar-green-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-stone-100 text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="line-clamp-2 flex-1 font-medium">
                  {s.title || "Untitled slide"}
                </span>
                {slides.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(i);
                    }}
                    className="text-stone-400 hover:text-red-700"
                    role="button"
                    aria-label="Delete slide"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={addSlide}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 p-2 text-sm text-stone-600 hover:border-calabar-green-400 hover:text-calabar-green-700"
            >
              <Plus className="h-4 w-4" />
              Add slide
            </button>
          </li>
        </ol>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <input
            value={slides[active]?.title ?? ""}
            onChange={(e) => update(active, { title: e.target.value })}
            placeholder="Slide title"
            className="w-full bg-transparent font-display text-2xl font-bold focus:outline-none"
          />
          <textarea
            value={slides[active]?.body ?? ""}
            onChange={(e) => update(active, { body: e.target.value })}
            placeholder="Bullet points or speaker notes…"
            rows={14}
            className="mt-4 w-full resize-y bg-transparent text-base leading-relaxed focus:outline-none"
          />
        </div>
      </div>

      {presenting && (
        <Presenter slides={slides} onClose={() => setPresenting(false)} />
      )}
    </div>
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
