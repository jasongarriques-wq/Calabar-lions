"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Slide = { title: string; body: string; bg: string };

const BG_OPTIONS: { key: string; label: string; style: React.CSSProperties }[] = [
  { key: "green",    label: "Forest",    style: { background: "linear-gradient(135deg, #064e3b, #1a3d24)" } },
  { key: "black",    label: "Night",     style: { background: "#0a0a0a" } },
  { key: "charcoal", label: "Charcoal",  style: { background: "#27272a" } },
  { key: "gold",     label: "Gold",      style: { background: "linear-gradient(135deg, #78350f, #1c1404)" } },
  { key: "blue",     label: "Ocean",     style: { background: "linear-gradient(135deg, #1e3a5f, #0c1a2e)" } },
  { key: "purple",   label: "Royal",     style: { background: "linear-gradient(135deg, #3b0764, #1a0330)" } },
];

function getSlideStyle(bg: string): React.CSSProperties {
  return BG_OPTIONS.find(b => b.key === bg)?.style ?? BG_OPTIONS[0].style;
}

function defaultSlides(): Slide[] {
  return [{ title: "Slide 1", body: "", bg: "green" }];
}

const MENU_TABS = ["File", "Home", "Insert", "Design", "Transitions", "Slideshow", "View"];

const ASSISTANT_ACTIONS = [
  { icon: "✨", label: "Improve this slide",       color: "#059669" },
  { icon: "🎯", label: "Sharpen key message",      color: "#2563eb" },
  { icon: "📝", label: "Add speaker notes",         color: "#7c3aed" },
  { icon: "🖼️", label: "Suggest slide layout",     color: "#dc2626" },
  { icon: "📊", label: "Add data visualisation",   color: "#ea580c" },
  { icon: "✅", label: "Check SBA requirements",   color: "#0891b2" },
];

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "none", border: "none", cursor: "pointer", color: "#333",
  borderRadius: 3, fontSize: 11, padding: "2px 5px", lineHeight: 1.3,
  display: "flex", alignItems: "center", gap: 3, ...extra,
});
const sep: React.CSSProperties = {
  width: 1, height: 36, background: "#e0e0e0", flexShrink: 0, margin: "0 4px",
};

export default function SlideEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [deckId, setDeckId]     = useState("");
  const [title, setTitle]       = useState("Untitled Presentation");
  const [slides, setSlides]     = useState<Slide[]>(defaultSlides());
  const [activeIdx, setActiveIdx] = useState(0);
  const [saved, setSaved]       = useState(true);
  const [loading, setLoading]   = useState(true);
  const [preview, setPreview]   = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [activeMenu, setActiveMenu]       = useState("Home");
  const [showThumbs, setShowThumbs]       = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase  = createClient();
  const router    = useRouter();

  useEffect(() => { params.then(({ id }) => setDeckId(id)); }, [params]);

  useEffect(() => {
    if (!deckId) return;
    (async () => {
      const { data: deck, error } = await supabase.from("slide_decks").select("*").eq("id", deckId).single();
      if (error || !deck) { router.push("/tools/slides"); return; }
      setTitle(deck.title ?? "Untitled Presentation");
      setSlides(Array.isArray(deck.slides) && deck.slides.length > 0 ? deck.slides : defaultSlides());
      setLoading(false);
    })();
  }, [deckId]);

  const scheduleSave = useCallback((t: string, s: Slide[]) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("slide_decks").update({ title: t, slides: s }).eq("id", deckId);
      setSaved(true);
    }, 1500);
  }, [deckId, supabase]);

  function updateSlide(idx: number, field: keyof Slide, value: string) {
    const newSlides = slides.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setSlides(newSlides);
    scheduleSave(title, newSlides);
  }

  function addSlide() {
    const newSlides = [...slides, { title: `Slide ${slides.length + 1}`, body: "", bg: "green" }];
    setSlides(newSlides);
    setActiveIdx(newSlides.length - 1);
    scheduleSave(title, newSlides);
  }

  function deleteSlide(idx: number) {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    setActiveIdx(Math.min(activeIdx, newSlides.length - 1));
    scheduleSave(title, newSlides);
  }

  function exportSlides() {
    const content = slides.map((s, i) =>
      `SLIDE ${i + 1}\n${"─".repeat(40)}\n${s.title}\n\n${s.body || "(no content)"}`
    ).join("\n\n");
    const text = `${title}\n${"═".repeat(40)}\n\n${content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${title || "presentation"}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const active = slides[activeIdx] ?? slides[0];

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3d24" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📽️</div>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Loading presentation…</p>
      </div>
    </div>
  );

  // ── FULLSCREEN PREVIEW ───────────────────────────────────────────────────────
  if (preview) {
    const slide = slides[previewIdx];
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", ...getSlideStyle(slide.bg) }}>
        <button onClick={() => setPreview(false)}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          ✕ Exit Slideshow
        </button>
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12 }}>
          <button disabled={previewIdx === 0} onClick={() => setPreviewIdx(i => Math.max(0, i - 1))}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", opacity: previewIdx === 0 ? 0.3 : 1 }}>
            ← Prev
          </button>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{previewIdx + 1} / {slides.length}</span>
          <button disabled={previewIdx === slides.length - 1} onClick={() => setPreviewIdx(i => Math.min(slides.length - 1, i + 1))}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", opacity: previewIdx === slides.length - 1 ? 0.3 : 1 }}>
            Next →
          </button>
        </div>
        <div style={{ maxWidth: 800, width: "100%", padding: "0 48px", textAlign: "center" }}>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: "white", marginBottom: 28, lineHeight: 1.1 }}>{slide.title}</h1>
          <p style={{ fontSize: 22, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{slide.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#e8e8e8" }}>

      {/* ══════════════════════════════════════════════════════════════════
          TOP BAR — dark green
      ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "#1a3d24", color: "white", height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", flexShrink: 0 }}>
        <Link href="/tools/slides" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 6 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>📽️</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>LION SLIDES</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>Present with confidence. Win with pride.</div>
          </div>
        </Link>

        {/* Undo / Redo */}
        <div style={{ display: "flex", gap: 1 }}>
          {[["↩", "Undo"], ["↪", "Redo"]].map(([icon, t]) => (
            <button key={t} title={t}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", padding: "4px 7px", borderRadius: 4, fontSize: 16 }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Title — centre */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); scheduleSave(e.target.value, slides); }}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "2px 8px", minWidth: 220, outline: "none" }}
            placeholder="Presentation title"
          />
          <span style={{ fontSize: 11, opacity: 0.65 }}>
            {saved ? <>☁ Saved</> : <span style={{ color: "#fbbf24" }}>Saving…</span>}
          </span>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => { setPreviewIdx(activeIdx); setPreview(true); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ▶ Slideshow
          </button>
          {["🔍", "🔔", "❓"].map(ic => (
            <button key={ic} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 15, padding: "4px 6px" }}>{ic}</button>
          ))}
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #059669, #0d4a2a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
            {title ? title[0].toUpperCase() : "S"}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          MENU BAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", padding: "0 10px", height: 34, flexShrink: 0 }}>
        <div style={{ display: "flex", flex: 1 }}>
          {MENU_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveMenu(tab)}
              style={{
                background: "none", border: "none", padding: "0 10px", height: 34, fontSize: 12,
                fontWeight: tab === activeMenu ? 600 : 400,
                color: tab === activeMenu ? "#1a3d24" : "#555",
                borderBottom: tab === activeMenu ? "2px solid #1a3d24" : "2px solid transparent",
                cursor: "pointer",
              }}>
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button style={{ ...btn(), border: "1px solid #ddd", padding: "3px 10px", borderRadius: 4 }}>🔗 Share</button>
          <button onClick={exportSlides} style={{ background: "#059669", color: "white", border: "none", borderRadius: 4, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export ▾</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOOLBAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 0, padding: "2px 8px", flexShrink: 0, height: 50, overflowX: "auto" }}>
        {/* Layout */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "3px 8px", cursor: "pointer", background: "none", border: "none" }}>
            <span style={{ fontSize: 20 }}>🖼️</span>
            <span style={{ fontSize: 9, color: "#555" }}>Layout</span>
          </button>
          <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "3px 8px", cursor: "pointer", background: "none", border: "none" }}>
            <span style={{ fontSize: 20 }}>🎨</span>
            <span style={{ fontSize: 9, color: "#555" }}>Theme</span>
          </button>
        </div>
        <div style={sep} />

        {/* Font */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <select style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 120 }}>
            <option>Calibri (Body)</option>
            <option>Times New Roman</option>
            <option>Arial</option>
            <option>Georgia</option>
          </select>
          <select defaultValue="24" style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 44 }}>
            {[14,16,18,20,24,28,32,36,40,48,60,72].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ width: 1, background: "#ddd", margin: "0 3px", height: 20 }} />
          {["B", "I", "U"].map(l => (
            <button key={l}
              style={{ ...btn({ width: 22, height: 22, justifyContent: "center", border: "1px solid transparent" }), ...(l === "B" ? { fontWeight: 900 } : l === "I" ? { fontStyle: "italic" } : { textDecoration: "underline" }) }}>
              {l}
            </button>
          ))}
        </div>
        <div style={sep} />

        {/* Alignment */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, padding: "0 6px" }}>
          <button style={btn()} title="Left">≡⬅</button>
          <button style={btn()} title="Center">≡</button>
          <button style={btn()} title="Right">≡➡</button>
        </div>
        <div style={sep} />

        {/* Background picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 8px" }}>
          <span style={{ fontSize: 10, color: "#777", fontWeight: 600 }}>BG:</span>
          {BG_OPTIONS.map(bg => (
            <button key={bg.key}
              onClick={() => updateSlide(activeIdx, "bg", bg.key)}
              title={bg.label}
              style={{ ...bg.style, width: 22, height: 22, borderRadius: 4, border: active.bg === bg.key ? "2px solid #1a3d24" : "2px solid #ddd", cursor: "pointer", outline: "none", boxShadow: active.bg === bg.key ? "0 0 0 1px #1a3d24" : "none" }}
            />
          ))}
        </div>
        <div style={sep} />

        {/* Slide actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <button onClick={addSlide}
            style={{ ...btn(), padding: "3px 10px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3 }}>
            + New Slide
          </button>
          <button
            onClick={() => deleteSlide(activeIdx)}
            style={{ ...btn({ color: "#dc2626" }), padding: "3px 10px", border: "1px solid #fee2e2", background: "#fff5f5", borderRadius: 3 }}
            disabled={slides.length <= 1}>
            🗑 Delete
          </button>
        </div>
        <div style={sep} />

        {/* Slideshow quick launch */}
        <button
          onClick={() => { setPreviewIdx(activeIdx); setPreview(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 8px", cursor: "pointer", background: "none", border: "none" }}>
          <span style={{ fontSize: 20 }}>▶</span>
          <span style={{ fontSize: 9, color: "#555", marginTop: 1 }}>Play</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SLIDE THUMBNAILS ─────────────────────────────────────────── */}
        {showThumbs && (
          <aside style={{ width: 180, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: "0.05em", textTransform: "uppercase" }}>Slides ({slides.length})</span>
              <button onClick={() => setShowThumbs(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {slides.map((slide, i) => (
                <div key={i} onClick={() => setActiveIdx(i)}
                  style={{ position: "relative", cursor: "pointer", borderRadius: 6, border: activeIdx === i ? "2px solid #1a3d24" : "2px solid #e0e0e0", overflow: "hidden", transition: "border-color 0.15s" }}>
                  {/* Mini slide preview */}
                  <div style={{ ...getSlideStyle(slide.bg), padding: "10px 8px", minHeight: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: "white", lineHeight: 1.2, overflow: "hidden", maxHeight: 30 }}>{slide.title}</div>
                    {slide.body && <div style={{ fontSize: 7, color: "rgba(255,255,255,0.65)", marginTop: 4, lineHeight: 1.2, overflow: "hidden", maxHeight: 20 }}>{slide.body.substring(0, 50)}</div>}
                  </div>
                  <div style={{ background: activeIdx === i ? "#f0fdf4" : "#fafafa", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: activeIdx === i ? "#1a3d24" : "#999", fontWeight: 600 }}>Slide {i + 1}</span>
                    {slides.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deleteSlide(i); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 9, padding: "1px 3px", lineHeight: 1 }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 10, borderTop: "1px solid #eee" }}>
              <button onClick={addSlide}
                style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg, #1a3d24, #0d2b14)", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Add Slide
              </button>
            </div>
          </aside>
        )}

        {/* ── SLIDE EDITOR CANVAS ─────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", background: "#e0e0e0", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" }}>
          {/* Slide number breadcrumb */}
          <div style={{ width: "100%", maxWidth: 900, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#777" }}>Slide {activeIdx + 1} of {slides.length}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={activeIdx === 0} onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                style={{ fontSize: 11, background: "white", border: "1px solid #ddd", borderRadius: 5, padding: "3px 10px", cursor: "pointer", opacity: activeIdx === 0 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <button disabled={activeIdx === slides.length - 1} onClick={() => setActiveIdx(i => Math.min(slides.length - 1, i + 1))}
                style={{ fontSize: 11, background: "white", border: "1px solid #ddd", borderRadius: 5, padding: "3px 10px", cursor: "pointer", opacity: activeIdx === slides.length - 1 ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          </div>

          {/* The slide */}
          <div style={{ width: "100%", maxWidth: 900, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ ...getSlideStyle(active.bg), minHeight: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 80px", textAlign: "center" }}>
              <input
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 40, fontWeight: 900, textAlign: "center", padding: "4px 0 12px", outline: "none", marginBottom: 24, letterSpacing: "-0.5px" }}
                placeholder="Slide title…"
                value={active.title}
                onChange={e => updateSlide(activeIdx, "title", e.target.value)}
              />
              <textarea
                style={{ width: "100%", resize: "none", background: "transparent", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 18, textAlign: "center", outline: "none", lineHeight: 1.6, fontFamily: "inherit", minHeight: 160 }}
                placeholder="Slide content…"
                rows={6}
                value={active.body}
                onChange={e => updateSlide(activeIdx, "body", e.target.value)}
              />
            </div>
          </div>

          {/* Speaker notes area */}
          <div style={{ width: "100%", maxWidth: 900, marginTop: 16 }}>
            <div style={{ background: "white", borderRadius: 8, border: "1px solid #ddd", padding: "10px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Speaker Notes</div>
              <textarea
                style={{ width: "100%", resize: "none", background: "transparent", border: "none", fontSize: 12, color: "#555", outline: "none", lineHeight: 1.5, fontFamily: "inherit", minHeight: 60 }}
                placeholder="Add speaker notes for this slide…"
                rows={3}
              />
            </div>
          </div>
        </main>

        {/* ── LION ASSISTANT SIDEBAR ──────────────────────────────────── */}
        {showAssistant && (
          <aside style={{ width: 260, background: "#fff", borderLeft: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase" }}>Lion Assistant</span>
              <button onClick={() => setShowAssistant(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <div style={{ padding: "14px 14px 8px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Present like a Lion! 🦁</p>
              <p style={{ fontSize: 11, color: "#777", marginTop: 4, marginBottom: 0 }}>Let me help you craft this slide.</p>
            </div>

            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {ASSISTANT_ACTIONS.map(({ icon, label, color }) => (
                <button key={label}
                  onClick={() => alert("AI presentation tools coming soon! 🦁")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 12, color: "#333", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f8f8f8")}
                >
                  <span style={{ fontSize: 15, color, flexShrink: 0, width: 22, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Deck stats */}
            <div style={{ margin: "14px 12px 0", borderTop: "1px solid #eee", paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Deck Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { label: "Total slides",   value: slides.length },
                  { label: "Current slide",  value: activeIdx + 1 },
                  { label: "Est. duration",  value: `${slides.length * 2} min` },
                  { label: "Background",     value: BG_OPTIONS.find(b => b.key === active.bg)?.label ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Slide completeness */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Slide Completion</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {slides.map((s, i) => {
                    const filled = (s.title && s.title !== `Slide ${i + 1}` ? 1 : 0) + (s.body ? 1 : 0);
                    const pct    = filled === 2 ? 100 : filled === 1 ? 50 : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => setActiveIdx(i)}>
                        <span style={{ fontSize: 9, color: "#888", width: 14, flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#059669" : "#f59e0b", borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 9, color: pct === 100 ? "#059669" : "#f59e0b", fontWeight: 700, width: 28 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATUS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#1a3d24", color: "rgba(255,255,255,0.75)", height: 22, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", fontSize: 10, flexShrink: 0 }}>
        <span>Slide {activeIdx + 1} of {slides.length}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Est. {slides.length * 2} min</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{BG_OPTIONS.find(b => b.key === active.bg)?.label} theme</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>English (Jamaica)</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowThumbs(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showThumbs ? "Hide Slides" : "Show Slides"}
          </button>
          <button onClick={() => setShowAssistant(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showAssistant ? "Hide Assistant" : "Show Assistant"}
          </button>
          <button onClick={() => { setPreviewIdx(0); setPreview(true); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 4, padding: "2px 10px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
            ▶ Present
          </button>
        </div>
      </footer>
    </div>
  );
}
