"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MENU_TABS = ["File", "Home", "Insert", "Format", "Tags", "View"];

const ASSISTANT_ACTIONS = [
  { icon: "📋", label: "Summarize this note",    color: "#059669" },
  { icon: "🔑", label: "Extract key points",     color: "#2563eb" },
  { icon: "🃏", label: "Create flashcards",       color: "#7c3aed" },
  { icon: "❓", label: "Quiz me on this",         color: "#dc2626" },
  { icon: "✏️", label: "Improve my notes",        color: "#ea580c" },
  { icon: "Aa", label: "Fix grammar & spelling",  color: "#0891b2" },
];

const NOTE_SUBJECTS = [
  "Mathematics", "English Language", "English Literature",
  "Chemistry", "Biology", "Physics",
  "History", "Geography", "Social Studies",
  "Spanish", "French", "Art",
  "Physical Education", "Information Technology",
];

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "none", border: "none", cursor: "pointer", color: "#333",
  borderRadius: 3, fontSize: 11, padding: "2px 5px", lineHeight: 1.3,
  display: "flex", alignItems: "center", gap: 3, ...extra,
});
const sep: React.CSSProperties = {
  width: 1, height: 36, background: "#e0e0e0", flexShrink: 0, margin: "0 4px",
};

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [title, setTitle]         = useState("");
  const [subject, setSubject]     = useState("");
  const [saved, setSaved]         = useState(true);
  const [loading, setLoading]     = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [noteId, setNoteId]       = useState("");
  const [activeMenu, setActiveMenu]       = useState("Home");
  const [showOutline, setShowOutline]     = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase  = createClient();
  const router    = useRouter();

  useEffect(() => { params.then(({ id }) => setNoteId(id)); }, [params]);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", noteId).single();
      if (error || !data) { router.push("/tools/notes"); return; }
      setTitle(data.title ?? ""); setSubject(data.subject ?? "");
      if (editorRef.current) editorRef.current.innerHTML = data.body ?? "";
      countWords(); setLoading(false);
    })();
  }, [noteId]);

  function countWords() {
    const txt = editorRef.current?.innerText ?? "";
    setWordCount(txt.trim().split(/\s+/).filter(Boolean).length);
  }

  const scheduleSave = useCallback(() => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const body = editorRef.current?.innerHTML ?? "";
      await supabase.from("documents").update({ title, subject, body }).eq("id", noteId);
      setSaved(true);
    }, 1500);
  }, [title, subject, noteId, supabase]);

  useEffect(() => { if (!loading && noteId) scheduleSave(); }, [title, subject, loading, noteId, scheduleSave]);

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    scheduleSave(); countWords();
  }

  function exportNote() {
    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Calibri,Georgia,serif;max-width:816px;margin:72px auto;font-size:11pt;line-height:1.65;color:#1a1a1a;}h1{font-size:1.5em;font-weight:700;margin:0.9em 0 0.4em;}h2{font-size:1.2em;font-weight:700;margin:0.7em 0 0.3em;}p{margin:0.35em 0;}</style></head><body><h1>${title}</h1>${subject ? `<p><em>Subject: ${subject}</em></p><hr>` : ""}${editorRef.current?.innerHTML ?? ""}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${title || "note"}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDictate() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition is not supported in this browser. Try Chrome."); return; }
    const recognition = new SR();
    recognition.lang = "en-JM";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => { exec("insertText", e.results[0][0].transcript + " "); };
    recognition.onerror = () => alert("Could not start microphone.");
    recognition.start();
  }

  const pageCount = Math.max(1, Math.ceil(wordCount / 250));

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3d24" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📓</div>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Loading note…</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#e8e8e8" }}>

      {/* ══════════════════════════════════════════════════════════════════
          TOP BAR — dark green
      ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "#1a3d24", color: "white", height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", flexShrink: 0 }}>
        <Link href="/tools/notes" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 6 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>📓</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>LION NOTES</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>Capture it. Revise it. Ace it.</div>
          </div>
        </Link>

        {/* Subject dropdown */}
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "white" }}>
          <option value="">📚 Select subject</option>
          {NOTE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Undo / Redo */}
        <div style={{ display: "flex", gap: 1 }}>
          {[["↩", "undo", "Undo"], ["↪", "redo", "Redo"]].map(([icon, cmd, t]) => (
            <button key={cmd} title={t} onClick={() => exec(cmd)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", padding: "4px 7px", borderRadius: 4, fontSize: 16 }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Title — centre */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "2px 8px", minWidth: 220, outline: "none" }}
            placeholder="Note title"
          />
          <span style={{ fontSize: 11, opacity: 0.65, display: "flex", alignItems: "center", gap: 4 }}>
            {saved ? <>☁ Saved</> : <span style={{ color: "#fbbf24" }}>Saving…</span>}
          </span>
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["🔍", "🔔", "❓"].map(ic => (
            <button key={ic} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 15, padding: "4px 6px" }}>{ic}</button>
          ))}
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #059669, #0d4a2a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
            {title ? title[0].toUpperCase() : "📓"}
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
          <button onClick={exportNote} style={{ background: "#059669", color: "white", border: "none", borderRadius: 4, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export ▾</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOOLBAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 0, padding: "2px 8px", flexShrink: 0, height: 50, overflowX: "auto" }}>
        {/* Clipboard */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: 8 }}>
          <button onMouseDown={e => { e.preventDefault(); exec("copy"); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "3px 8px", cursor: "pointer", background: "none", border: "none" }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontSize: 9, color: "#555" }}>Copy</span>
          </button>
          <button onMouseDown={e => { e.preventDefault(); exec("cut"); }} style={btn({ padding: "1px 6px", fontSize: 10 })}>✂ Cut</button>
        </div>
        <div style={sep} />

        {/* Font */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <select onChange={e => exec("fontName", e.target.value)}
            style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 120 }}>
            <option>Calibri (Body)</option>
            <option>Times New Roman</option>
            <option>Arial</option>
            <option>Georgia</option>
          </select>
          <select defaultValue="11" onChange={e => exec("fontSize", e.target.value)}
            style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 40 }}>
            {[8,9,10,11,12,14,16,18,20,24].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ width: 1, background: "#ddd", margin: "0 3px", height: 20 }} />
          {[
            { l: "B", cmd: "bold",      style: { fontWeight: 900 } as React.CSSProperties },
            { l: "I", cmd: "italic",    style: { fontStyle: "italic" } as React.CSSProperties },
            { l: "U", cmd: "underline", style: { textDecoration: "underline" } as React.CSSProperties },
          ].map(({ l, cmd, style }) => (
            <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }}
              style={{ ...btn({ width: 22, height: 22, justifyContent: "center", border: "1px solid transparent" }), ...style }}>
              {l}
            </button>
          ))}
          {["#dc2626","#ea580c","#ca8a04","#16a34a","#2563eb","#7c3aed"].map(c => (
              <button key={c} onMouseDown={e => { e.preventDefault(); exec("foreColor", c); }}
                title="Font colour"
                style={{ width: 13, height: 13, borderRadius: 2, background: c, border: "1px solid rgba(0,0,0,0.25)", cursor: "pointer", flexShrink: 0 }} />
            ))}
          <button onMouseDown={e => { e.preventDefault(); exec("backColor", "#fef08a"); }} style={btn({ fontSize: 14 })} title="Highlight yellow">🖊</button>
        </div>
        <div style={sep} />

        {/* Paragraph */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, padding: "0 6px" }}>
          <button onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} style={btn()} title="Bullets">≡•</button>
          <button onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} style={btn()} title="Numbers">≡1</button>
          <button onMouseDown={e => { e.preventDefault(); exec("indent"); }} style={btn()} title="Indent">⇥</button>
          <button onMouseDown={e => { e.preventDefault(); exec("outdent"); }} style={btn()} title="Outdent">⇤</button>
          <div style={{ width: 1, background: "#ddd", margin: "0 2px", height: 20 }} />
          <button onMouseDown={e => { e.preventDefault(); exec("justifyLeft"); }} style={btn()} title="Left">≡⬅</button>
          <button onMouseDown={e => { e.preventDefault(); exec("justifyCenter"); }} style={btn()} title="Center">≡</button>
          <button onMouseDown={e => { e.preventDefault(); exec("justifyRight"); }} style={btn()} title="Right">≡➡</button>
        </div>
        <div style={sep} />

        {/* Styles */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "p"); }}
            style={{ ...btn(), padding: "4px 8px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 11 }}>Normal</button>
          <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h1"); }}
            style={{ ...btn(), padding: "4px 8px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 11, fontWeight: 700 }}>H1</button>
          <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h2"); }}
            style={{ ...btn(), padding: "4px 8px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 11, fontWeight: 600 }}>H2</button>
        </div>
        <div style={sep} />

        {/* Dictate */}
        <div onClick={handleDictate} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px", cursor: "pointer" }}>
          <span style={{ fontSize: 20 }}>🎤</span>
          <span style={{ fontSize: 9, color: "#555", marginTop: 1 }}>Dictate</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY: sidebar + canvas + assistant
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SUBJECTS SIDEBAR ─────────────────────────────────────────── */}
        {showOutline && (
          <aside style={{ width: 220, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: "0.05em", textTransform: "uppercase" }}>Subjects</span>
                <button onClick={() => setShowOutline(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0 }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {NOTE_SUBJECTS.map(s => (
                <div key={s}
                  onClick={() => setSubject(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 16px",
                    cursor: "pointer",
                    background: subject === s ? "rgba(26,61,36,0.07)" : "transparent",
                    borderLeft: subject === s ? "3px solid #1a3d24" : "3px solid transparent",
                  }}>
                  <span style={{ color: subject === s ? "#059669" : "#d1d5db", fontSize: 9 }}>●</span>
                  <span style={{ fontSize: 12, color: subject === s ? "#1a3d24" : "#444", fontWeight: subject === s ? 600 : 400 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
              <Link href="/tools/notes"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "9px 0", background: "linear-gradient(135deg, #1a3d24, #0d2b14)", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                ← All Notes
              </Link>
            </div>
          </aside>
        )}

        {/* ── DOCUMENT CANVAS ─────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", background: "#e0e0e0", padding: "24px 16px" }}>
          <div style={{ maxWidth: 816, margin: "0 auto", boxShadow: "0 2px 16px rgba(0,0,0,0.18)" }}>
            <div
              style={{ background: "white", padding: "72px 96px 120px", minHeight: 1056, boxSizing: "border-box" }}
              onClick={() => editorRef.current?.focus()}
            >
              {subject && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "3px 12px", marginBottom: 20, fontSize: 11, color: "#059669", fontWeight: 600 }}>
                  📚 {subject}
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { scheduleSave(); countWords(); }}
                style={{
                  outline: "none", minHeight: 600,
                  fontSize: 11, fontFamily: "Calibri, Georgia, serif",
                  lineHeight: 1.65, color: "#1a1a1a",
                }}
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
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Study smarter! 🦁</p>
              <p style={{ fontSize: 11, color: "#777", marginTop: 4, marginBottom: 0 }}>Let me help you with this note.</p>
            </div>

            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {ASSISTANT_ACTIONS.map(({ icon, label, color }) => (
                <button key={label}
                  onClick={() => alert("AI study tools coming soon! 🦁")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 12, color: "#333", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f8f8f8")}
                >
                  <span style={{ fontSize: 15, color, flexShrink: 0, width: 22, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Note stats */}
            <div style={{ margin: "14px 12px 0", borderTop: "1px solid #eee", paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Note Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { label: "Word count", value: wordCount },
                  { label: "Est. pages",  value: pageCount },
                  { label: "Subject",     value: subject || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATUS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#1a3d24", color: "rgba(255,255,255,0.75)", height: 22, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", fontSize: 10, flexShrink: 0 }}>
        <span>Page 1 of {pageCount}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{wordCount} words</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{subject || "No subject"}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>English (Jamaica)</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowOutline(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showOutline ? "Hide Subjects" : "Show Subjects"}
          </button>
          <button onClick={() => setShowAssistant(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showAssistant ? "Hide Assistant" : "Show Assistant"}
          </button>
          <span style={{ opacity: 0.5 }}>─ 100% +</span>
        </div>
      </footer>

      <style jsx global>{`
        [contenteditable] h1 { font-size:1.5em; font-weight:700; margin:0.9em 0 0.4em; }
        [contenteditable] h2 { font-size:1.2em; font-weight:700; margin:0.7em 0 0.3em; }
        [contenteditable] h3 { font-size:1.05em; font-weight:600; margin:0.6em 0 0.2em; }
        [contenteditable] p  { margin:0.35em 0; }
        [contenteditable] ul { list-style:disc;    padding-left:1.6em; margin:0.3em 0; }
        [contenteditable] ol { list-style:decimal; padding-left:1.6em; margin:0.3em 0; }
        [contenteditable] li { margin:0.15em 0; }
      `}</style>
    </div>
  );
}
