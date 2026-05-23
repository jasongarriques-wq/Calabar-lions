"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Doc = {
  id: string; title: string; body: string;
  subject: string | null; status: string; kind: string;
};

const SBA_SECTIONS = [
  "Cover Page","Table of Contents","Introduction","Research Question",
  "Aim / Purpose","Methodology","Data Collection","Analysis",
  "Findings","Conclusion","Recommendations","Bibliography","Appendix",
];

const MENU_TABS = [
  "File","Home","Insert","Draw","Design",
  "Layout","References","Mailings","Review","View","Help",
];

const ASSISTANT_ACTIONS = [
  { icon: "✏️", label: "Improve this paragraph",  color: "#059669" },
  { icon: "Aa", label: "Check grammar & spelling", color: "#2563eb" },
  { icon: "🎯", label: "Strengthen my thesis",     color: "#dc2626" },
  { icon: "📚", label: "Generate bibliography",    color: "#7c3aed" },
  { icon: "✅", label: "Check SBA requirements",   color: "#059669" },
  { icon: "📝", label: "Make writing more formal", color: "#ea580c" },
];

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "none", border: "none", cursor: "pointer", color: "#333",
  borderRadius: 3, fontSize: 11, padding: "2px 5px", lineHeight: 1.3,
  display: "flex", alignItems: "center", gap: 3, ...extra,
});
const sep: React.CSSProperties = {
  width: 1, height: 36, background: "#e0e0e0", flexShrink: 0, margin: "0 4px",
};

function StatusIcon({ s }: { s: string }) {
  if (s === "done")   return <span style={{ color: "#059669", fontSize: 13 }}>✔</span>;
  if (s === "active") return <span style={{ color: "#f59e0b", fontSize: 10 }}>●</span>;
  return <span style={{ color: "#d1d5db", fontSize: 15 }}>○</span>;
}

function Gauge({ pct }: { pct: number }) {
  const r = 26, circ = 2 * Math.PI * r;
  const color = pct >= 75 ? "#059669" : "#f59e0b";
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${circ * pct / 100} ${circ * (1 - pct / 100)}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="34" y="39" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1a1a1a">{pct}%</text>
    </svg>
  );
}

export default function DocEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [title, setTitle]           = useState("");
  const [subject, setSubject]       = useState("");
  const [status, setStatus]         = useState("draft");
  const [saved, setSaved]           = useState(true);
  const [loading, setLoading]       = useState(true);
  const [wordCount, setWordCount]   = useState(0);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [activeSection, setActiveSection] = useState("Analysis");
  const [showOutline, setShowOutline]     = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);
  const [docId, setDocId]           = useState("");
  const [toast, setToast]           = useState<string | null>(null);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findTerm, setFindTerm]     = useState("");
  const [pageColor, setPageColor]   = useState("#ffffff");
  const [isDictating, setIsDictating] = useState(false);

  const editorRef  = useRef<HTMLDivElement>(null);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase   = createClient();
  const router     = useRouter();

  useEffect(() => { params.then(({ id }) => setDocId(id)); }, [params]);

  // Initialise contentEditable defaults once mounted
  useEffect(() => {
    if (editorRef.current) {
      document.execCommand("defaultParagraphSeparator", false, "p");
    }
  }, []);

  useEffect(() => {
    if (!docId) return;
    (async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", docId).single();
      if (error || !data) { router.push("/tools/docs"); return; }
      setTitle(data.title ?? "");
      setSubject(data.subject ?? "");
      setStatus(data.status ?? "draft");
      if (editorRef.current) {
        editorRef.current.innerHTML = data.body || "<p><br></p>";
        document.execCommand("defaultParagraphSeparator", false, "p");
      }
      countWords();
      setLoading(false);
    })();
  }, [docId]);

  function countWords() {
    const txt = editorRef.current?.innerText ?? "";
    setWordCount(txt.trim().split(/\s+/).filter(Boolean).length);
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const scheduleSave = useCallback(() => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const body = editorRef.current?.innerHTML ?? "";
      await supabase.from("documents").update({ title, subject, status, body }).eq("id", docId);
      setSaved(true);
    }, 1500);
  }, [title, subject, status, docId, supabase]);

  useEffect(() => {
    if (!loading && docId) scheduleSave();
  }, [title, subject, status, loading, docId, scheduleSave]);

  // Core execCommand wrapper — enables CSS styling for all commands
  function exec(cmd: string, val?: string) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    scheduleSave(); countWords();
  }

  // ── Bold fix ──────────────────────────────────────────────────────────────────
  // Browser's queryCommandState('bold') returns true inside <h1>/<h2>/<h3> because
  // those elements have font-weight:700 by default. Without the styleWithCSS flag
  // execCommand('bold') silently adds font-weight:normal (removing inherited bold)
  // instead of adding explicit bold to the selection.
  // Fix: always use styleWithCSS so the command applies inline CSS font-weight.
  function execBold() {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("bold", false);
    editorRef.current?.focus();
    scheduleSave(); countWords();
  }

  // ── Font size fix ─────────────────────────────────────────────────────────────
  // execCommand('fontSize') only accepts 1–7 (browser keyword scale), not pt values.
  // Workaround: mark with size "7" (xxx-large), then find the inserted element and
  // replace its font-size with the actual pt value.
  function setFontSize(pt: number) {
    const editor = editorRef.current;
    if (!editor) return;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, "7");
    // Replace CSS spans (styleWithCSS path)
    editor.querySelectorAll<HTMLElement>('[style*="xxx-large"]').forEach(el => {
      el.style.fontSize = `${pt}pt`;
    });
    // Replace legacy <font size="7"> tags (non-styleWithCSS fallback)
    editor.querySelectorAll<HTMLElement>('font[size="7"]').forEach(el => {
      const span = document.createElement("span");
      span.style.fontSize = `${pt}pt`;
      span.innerHTML = el.innerHTML;
      el.parentNode?.replaceChild(span, el);
    });
    editor.focus();
    scheduleSave(); countWords();
  }

  function exportDoc() {
    const html = [
      `<!DOCTYPE html><html><head><title>${title}</title>`,
      `<style>body{font-family:Calibri,Georgia,serif;max-width:816px;margin:96px auto;`,
      `font-size:11pt;line-height:1.65;color:#1a1a1a;}`,
      `h1{font-size:1.5em;font-weight:700;margin:0.9em 0 0.4em;}`,
      `h2{font-size:1.2em;font-weight:700;margin:0.7em 0 0.3em;}`,
      `p{margin:0.35em 0;}`,
      `table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}`,
      `blockquote{border-left:3px solid #1a3d24;padding-left:12px;color:#555;font-style:italic;}`,
      `</style></head><body>`,
      editorRef.current?.innerHTML ?? "",
      `</body></html>`,
    ].join("");
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${title || "document"}.html`; a.click();
    URL.revokeObjectURL(url);
    showToast("Document exported as HTML 📄");
  }

  function handleDictate() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { showToast("Speech recognition needs Chrome or Edge 🎤"); return; }
    if (isDictating) { setIsDictating(false); return; }
    const recognition = new SR();
    recognition.lang = "en-JM";
    recognition.interimResults = false;
    recognition.continuous = true;
    setIsDictating(true);
    recognition.onresult = (e: any) => {
      exec("insertText", e.results[e.results.length - 1][0].transcript + " ");
    };
    recognition.onerror  = () => { setIsDictating(false); showToast("Microphone access needed 🎤"); };
    recognition.onend    = () => setIsDictating(false);
    recognition.start();
  }

  function doFind() {
    if (!findTerm) return;
    const found = (window as any).find?.(findTerm, false, false, true, false, true, false);
    if (!found) showToast(`"${findTerm}" not found in document`);
  }

  function insertLink() {
    const url = prompt("Enter URL (e.g. https://example.com):");
    if (url) { exec("createLink", url); showToast("Link inserted 🔗"); }
  }

  function insertTable(rows: number, cols: number) {
    const td = `<td style="border:1px solid #ccc;padding:6px;min-width:60px;"> </td>`;
    const tr = `<tr>${Array(cols).fill(td).join("")}</tr>`;
    const table = [
      `<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:11pt;">`,
      Array(rows).fill(tr).join(""),
      `</table><p><br></p>`,
    ].join("");
    exec("insertHTML", table);
    showToast(`${rows}×${cols} table inserted 📊`);
  }

  // Derived values
  const sectionStatus = SBA_SECTIONS.map((_, i) =>
    i < 7 ? "done" : i === 7 ? "active" : "pending"
  );
  const doneCount = sectionStatus.filter(s => s === "done").length;
  const progress  = Math.round((doneCount / SBA_SECTIONS.length) * 100);
  const pageCount = Math.max(1, Math.ceil(wordCount / 250));

  // ── Toolbar renderer ──────────────────────────────────────────────────────────
  function renderToolbar() {
    switch (activeMenu) {

      // ── FILE ────────────────────────────────────────────────────────────────
      case "File":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: "100%" }}>
            <button onClick={() => router.push("/tools/docs")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 12px", borderRadius: 4 }}>⬅ Back to Docs</button>
            <div style={sep} />
            <button onClick={exportDoc}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 12px", borderRadius: 4 }}>📄 Export HTML</button>
            <button onClick={() => showToast("PDF export coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 12px", borderRadius: 4 }}>📑 Export PDF</button>
            <button onClick={() => window.print()}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 12px", borderRadius: 4 }}>🖨 Print</button>
            <div style={sep} />
            <button onClick={() => showToast("Document settings coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 12px", borderRadius: 4 }}>⚙️ Settings</button>
          </div>
        );

      // ── INSERT ───────────────────────────────────────────────────────────────
      case "Insert":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", height: "100%", flexWrap: "wrap" }}>
            <button onMouseDown={e => { e.preventDefault(); insertLink(); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>🔗 Link</button>
            <button onMouseDown={e => { e.preventDefault(); insertTable(3, 4); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📊 Table 3×4</button>
            <button onMouseDown={e => { e.preventDefault(); insertTable(2, 3); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📊 Table 2×3</button>
            <div style={sep} />
            <button onMouseDown={e => { e.preventDefault(); exec("insertHorizontalRule"); showToast("Divider inserted"); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>— Rule</button>
            <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "blockquote"); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>&ldquo;&rdquo; Quote Block</button>
            <div style={sep} />
            <button onClick={() => showToast("Image upload coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📷 Image</button>
            <button onClick={() => showToast("Footnotes coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>[1] Footnote</button>
            <button onClick={() => showToast("Page break coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📄 Page Break</button>
          </div>
        );

      // ── DRAW ─────────────────────────────────────────────────────────────────
      case "Draw":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: "100%" }}>
            <span style={{ fontSize: 24 }}>🎨</span>
            <span style={{ fontSize: 12, color: "#666" }}>Drawing tools — coming soon in Lion Docs 2.0 🦁</span>
          </div>
        );

      // ── DESIGN ───────────────────────────────────────────────────────────────
      case "Design":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: "100%" }}>
            <span style={{ fontSize: 11, color: "#666" }}>Page Colour:</span>
            {([["#ffffff","White"],["#fffef0","Cream"],["#f0f7ff","Sky"],["#f0fdf4","Mint"],["#fdf4ff","Lavender"]] as [string,string][]).map(([c, label]) => (
              <button key={c} title={label} onClick={() => { setPageColor(c); showToast(`Page colour: ${label}`); }}
                style={{ width: 24, height: 24, borderRadius: 4, background: c, border: pageColor === c ? "2px solid #1a3d24" : "1px solid #bbb", cursor: "pointer", boxShadow: pageColor === c ? "0 0 0 2px rgba(26,61,36,0.25)" : "none" }} />
            ))}
            <div style={sep} />
            <button onClick={() => showToast("Page borders coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📐 Borders</button>
            <button onClick={() => showToast("Themes coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>🎨 Theme</button>
            <button onClick={() => showToast("Watermarks coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>💧 Watermark</button>
          </div>
        );

      // ── LAYOUT ───────────────────────────────────────────────────────────────
      case "Layout":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: "100%" }}>
            <span style={{ fontSize: 11, color: "#666" }}>Margins:</span>
            {["Normal","Narrow","Wide"].map(m => (
              <button key={m} onClick={() => showToast(`${m} margins coming soon 🦁`)}
                style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>{m}</button>
            ))}
            <div style={sep} />
            <span style={{ fontSize: 11, color: "#666" }}>Orientation:</span>
            <button onClick={() => showToast("Portrait is default 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4, background: "#e8f5e9" }}>📄 Portrait</button>
            <button onClick={() => showToast("Landscape mode coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📃 Landscape</button>
            <div style={sep} />
            <span style={{ fontSize: 11, color: "#666" }}>Columns:</span>
            <button onClick={() => showToast("Column layout coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>▮ One</button>
            <button onClick={() => showToast("Two-column layout coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>▮▮ Two</button>
          </div>
        );

      // ── REFERENCES ───────────────────────────────────────────────────────────
      case "References":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: "100%" }}>
            <button onClick={() => showToast("Footnote insertion coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>[1] Insert Footnote</button>
            <button onClick={() => showToast("Endnote insertion coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>[*] Insert Endnote</button>
            <div style={sep} />
            <span style={{ fontSize: 11, color: "#666" }}>Citation Style:</span>
            {["Harvard","APA","MLA","Chicago"].map(s => (
              <button key={s} onClick={() => showToast(`${s} citations coming soon 🦁`)}
                style={{ ...btn(), border: "1px solid #ddd", padding: "5px 8px", borderRadius: 4 }}>{s}</button>
            ))}
            <div style={sep} />
            <button onClick={() => showToast("Bibliography generator coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📚 Bibliography</button>
          </div>
        );

      // ── MAILINGS ─────────────────────────────────────────────────────────────
      case "Mailings":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: "100%" }}>
            <span style={{ fontSize: 24 }}>✉️</span>
            <span style={{ fontSize: 12, color: "#666" }}>Mail merge tools — coming soon in Lion Docs 2.0 🦁</span>
          </div>
        );

      // ── REVIEW ───────────────────────────────────────────────────────────────
      case "Review":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: "100%" }}>
            <button onClick={() => showToast("Spell checker coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>🔤 Spelling & Grammar</button>
            <button onClick={() => showToast(`📊 ${wordCount} words · ${pageCount} page${pageCount !== 1 ? "s" : ""} · ${SBA_SECTIONS.length - doneCount} SBA sections remaining`)}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>🔢 Word Count</button>
            <div style={sep} />
            <button onClick={() => showToast("Track Changes coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📝 Track Changes</button>
            <button onClick={() => showToast("Comments panel coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>💬 Comments</button>
            <div style={sep} />
            <button onClick={() => { setShowFindBar(v => !v); setActiveMenu("Home"); }}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4, background: showFindBar ? "#e8f5e9" : undefined }}>🔍 Find</button>
            <button onClick={() => showToast("Find & Replace coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>↔ Replace</button>
          </div>
        );

      // ── VIEW ─────────────────────────────────────────────────────────────────
      case "View":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: "100%" }}>
            <button onClick={() => setShowOutline(v => !v)}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4, background: showOutline ? "#e8f5e9" : undefined }}>
              📋 {showOutline ? "Hide Outline" : "Show Outline"}
            </button>
            <button onClick={() => setShowAssistant(v => !v)}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4, background: showAssistant ? "#e8f5e9" : undefined }}>
              🤖 {showAssistant ? "Hide Assistant" : "Show Assistant"}
            </button>
            <div style={sep} />
            <span style={{ fontSize: 11, color: "#666" }}>Zoom:</span>
            {["75%","100%","125%","150%"].map(z => (
              <button key={z} onClick={() => showToast(`Zoom ${z} coming soon 🦁`)}
                style={{ ...btn(), border: "1px solid #ddd", padding: "5px 8px", borderRadius: 4, background: z === "100%" ? "#e8f5e9" : undefined }}>{z}</button>
            ))}
            <div style={sep} />
            <button onClick={() => window.print()}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>🖨 Print Preview</button>
          </div>
        );

      // ── HELP ─────────────────────────────────────────────────────────────────
      case "Help":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", height: "100%" }}>
            <span style={{ fontSize: 22 }}>❓</span>
            <span style={{ fontSize: 12, color: "#444" }}>
              Use the <strong>Lion Assistant</strong> panel on the right, or contact your teacher for SBA guidance.
            </span>
            <button onClick={() => showToast("Full help guide coming soon 🦁")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>📖 Guide</button>
            <button onClick={() => showToast("Keyboard shortcuts: Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+Z Undo · Ctrl+Y Redo")}
              style={{ ...btn(), border: "1px solid #ddd", padding: "5px 10px", borderRadius: 4 }}>⌨️ Shortcuts</button>
          </div>
        );

      // ── HOME (default) ───────────────────────────────────────────────────────
      default:
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "2px 8px", overflowX: "auto", height: "100%" }}>

            {/* Clipboard */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: 6 }}>
              <button onMouseDown={e => e.preventDefault()}
                onClick={() => showToast("Press Ctrl+V to paste 📋")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "3px 8px", cursor: "pointer", background: "none", border: "none" }}>
                <span style={{ fontSize: 22 }}>📋</span>
                <span style={{ fontSize: 9, color: "#555" }}>Paste</span>
              </button>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button onMouseDown={e => { e.preventDefault(); exec("cut"); }}       style={btn({ padding: "1px 6px", fontSize: 10 })}>✂ Cut</button>
                <button onMouseDown={e => { e.preventDefault(); exec("copy"); }}      style={btn({ padding: "1px 6px", fontSize: 10 })}>⎘ Copy</button>
                <button onClick={() => showToast("Select source text first, then use Format Painter 🖌")}
                  style={btn({ padding: "1px 6px", fontSize: 10 })}>🖌 Format Painter</button>
              </div>
            </div>
            <div style={sep} />

            {/* Font */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 6px" }}>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <select onChange={e => exec("fontName", e.target.value)}
                  style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 130 }}>
                  <option value="Calibri">Calibri (Body)</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
                <select defaultValue="11" onChange={e => setFontSize(parseInt(e.target.value))}
                  style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 44 }}>
                  {[8,9,10,11,12,14,16,18,20,24,28,36,48,72].map(s =>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
                <button onMouseDown={e => { e.preventDefault(); setFontSize(14); }} style={btn()} title="Increase font size">A↑</button>
                <button onMouseDown={e => { e.preventDefault(); setFontSize(9); }}  style={btn()} title="Decrease font size">A↓</button>
              </div>
              <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
                {[
                  { l: "B", onMD: () => execBold(),           extra: { fontWeight: 900 } },
                  { l: "I", onMD: () => exec("italic"),        extra: { fontStyle: "italic" as const } },
                  { l: "U", onMD: () => exec("underline"),     extra: { textDecoration: "underline" } },
                  { l: "S", onMD: () => exec("strikeThrough"), extra: { textDecoration: "line-through" } },
                ].map(({ l, onMD, extra }) => (
                  <button key={l} onMouseDown={e => { e.preventDefault(); onMD(); }}
                    style={{ ...btn({ width: 22, height: 22, justifyContent: "center", border: "1px solid transparent" }), ...extra }}>
                    {l}
                  </button>
                ))}
                <div style={{ width: 1, background: "#ddd", margin: "0 3px" }} />
                {(["#dc2626","#ea580c","#ca8a04","#16a34a","#2563eb","#7c3aed"] as string[]).map(c => (
                  <button key={c} onMouseDown={e => { e.preventDefault(); exec("foreColor", c); }}
                    title="Font colour"
                    style={{ width: 13, height: 13, borderRadius: 2, background: c, border: "1px solid rgba(0,0,0,0.25)", cursor: "pointer", flexShrink: 0 }} />
                ))}
                <button onMouseDown={e => { e.preventDefault(); exec("foreColor", "#1a1a1a"); }}
                  style={{ width: 13, height: 13, borderRadius: 2, background: "#1a1a1a", border: "1px solid #ccc", cursor: "pointer", flexShrink: 0 }} title="Black" />
                <button onMouseDown={e => { e.preventDefault(); exec("backColor", "#fef08a"); }}
                  style={btn({ fontSize: 14 })} title="Highlight yellow">🖊</button>
                <button onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }}
                  style={btn({ fontSize: 10, color: "#888" })} title="Clear all formatting">✕A</button>
              </div>
            </div>
            <div style={sep} />

            {/* Paragraph */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 6px" }}>
              <div style={{ display: "flex", gap: 1 }}>
                <button onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} style={btn()} title="Bullet list">≡•</button>
                <button onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }}  style={btn()} title="Numbered list">≡1</button>
                <button onClick={() => showToast("Multi-level list coming soon 🦁")} style={btn()} title="Multi-level list">≡↕</button>
                <div style={{ width: 1, background: "#ddd", margin: "0 2px" }} />
                <button onMouseDown={e => { e.preventDefault(); exec("outdent"); }} style={btn()} title="Decrease indent">⇤</button>
                <button onMouseDown={e => { e.preventDefault(); exec("indent"); }}  style={btn()} title="Increase indent">⇥</button>
                <button onClick={() => showToast("Sort coming soon 🦁")}                  style={btn()} title="Sort">↕A</button>
                <button onClick={() => showToast("Formatting marks toggle coming soon 🦁")} style={btn()} title="Show formatting marks">¶</button>
              </div>
              <div style={{ display: "flex", gap: 1 }}>
                {[
                  { icon: "≡⬅", cmd: "justifyLeft",   title: "Align Left"  },
                  { icon: "≡",   cmd: "justifyCenter", title: "Center"      },
                  { icon: "≡➡", cmd: "justifyRight",  title: "Align Right" },
                  { icon: "☰",  cmd: "justifyFull",   title: "Justify"     },
                ].map(({ icon, cmd, title }) => (
                  <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }} style={btn()} title={title}>{icon}</button>
                ))}
                <div style={{ width: 1, background: "#ddd", margin: "0 2px" }} />
                <button onClick={() => showToast("Line spacing options coming soon 🦁")} style={btn()} title="Line spacing">↕</button>
              </div>
            </div>
            <div style={sep} />

            {/* Styles */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
              <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "p"); }}
                style={{ ...btn(), padding: "4px 10px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 12 }}>Normal</button>
              <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h1"); }}
                style={{ ...btn(), padding: "4px 10px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 12, fontWeight: 700 }}>Heading 1</button>
              <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h2"); }}
                style={{ ...btn(), padding: "4px 10px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 12, fontWeight: 700, color: "#444" }}>Heading 2</button>
              <button onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h3"); }}
                style={{ ...btn(), padding: "4px 10px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3, fontSize: 11, color: "#555" }}>Heading 3</button>
            </div>
            <div style={sep} />

            {/* Editing */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 6px" }}>
              <button onClick={() => setShowFindBar(v => !v)}
                style={btn({ fontSize: 10, background: showFindBar ? "#e8f5e9" : undefined, borderRadius: 3, padding: "2px 6px" })}>🔍 Find</button>
              <button onClick={() => showToast("Find & Replace coming soon 🦁")} style={btn({ fontSize: 10 })}>↔ Replace</button>
              <button onMouseDown={e => { e.preventDefault(); exec("selectAll"); showToast("All text selected"); }}
                style={btn({ fontSize: 10 })}>⬚ Select All</button>
            </div>
            <div style={sep} />

            {/* Dictate */}
            <div onClick={handleDictate}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px", cursor: "pointer" }}>
              <span style={{ fontSize: 22 }}>{isDictating ? "🔴" : "🎤"}</span>
              <span style={{ fontSize: 9, color: isDictating ? "#dc2626" : "#555", marginTop: 1 }}>
                {isDictating ? "Stop" : "Dictate"}
              </span>
            </div>

          </div>
        );
    }
  }

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3d24" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🦁</div>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Loading document…</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#e8e8e8" }}>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#1a3d24", color: "white",
          padding: "9px 20px", borderRadius: 22, fontSize: 12, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)", pointerEvents: "none",
          whiteSpace: "nowrap", maxWidth: "80vw", textOverflow: "ellipsis", overflow: "hidden",
        }}>
          {toast}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "#1a3d24", color: "white", height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", flexShrink: 0 }}>
        <Link href="/tools/docs" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 6 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>🦁</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>LION DOCS</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>Write like a Lion. Submit with pride.</div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
          SBA Document <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
        </div>

        <div style={{ display: "flex", gap: 1 }}>
          {([ ["↩","undo","Undo"], ["↪","redo","Redo"] ] as [string,string,string][]).map(([icon, cmd, ttl]) => (
            <button key={cmd} title={ttl} onClick={() => exec(cmd)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", padding: "4px 7px", borderRadius: 4, fontSize: 16 }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Centred title */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "2px 8px", minWidth: 220, outline: "none" }}
            placeholder="Document title" />
          <span style={{ fontSize: 11, opacity: 0.65, display: "flex", alignItems: "center", gap: 4 }}>
            {saved ? <>☁ Saved</> : <span style={{ color: "#fbbf24" }}>Saving…</span>}
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => { setShowFindBar(v => !v); setActiveMenu("Home"); }}
            title="Find in document"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 15, padding: "4px 6px" }}>🔍</button>
          <button onClick={() => showToast("Notifications coming soon 🔔")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 15, padding: "4px 6px" }}>🔔</button>
          <button onClick={() => setActiveMenu("Help")}
            title="Help"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 15, padding: "4px 6px" }}>❓</button>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #059669, #0d4a2a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
            {title ? title[0].toUpperCase() : "JB"}
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
          <button onClick={() => showToast("Comments panel coming soon 🦁")}
            style={{ ...btn(), border: "1px solid #ddd", padding: "3px 10px", borderRadius: 4 }}>💬 Comments</button>
          <button onClick={() => showToast("Share feature coming soon — invite classmates! 🦁")}
            style={{ ...btn(), border: "1px solid #ddd", padding: "3px 10px", borderRadius: 4 }}>🔗 Share</button>
          <button onClick={exportDoc}
            style={{ background: "#059669", color: "white", border: "none", borderRadius: 4, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Export ▾
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DYNAMIC TOOLBAR (changes with active menu tab)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", flexShrink: 0, minHeight: 58, overflowX: "auto" }}>
        {renderToolbar()}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FIND BAR
      ══════════════════════════════════════════════════════════════════ */}
      {showFindBar && (
        <div style={{ background: "#fffde7", borderBottom: "1px solid #f59e0b", display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "#555" }}>🔍 Find:</span>
          <input
            value={findTerm}
            onChange={e => setFindTerm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doFind()}
            placeholder="Search in document…"
            style={{ border: "1px solid #ccc", borderRadius: 4, padding: "4px 10px", fontSize: 12, outline: "none", width: 240 }}
            autoFocus
          />
          <button onClick={doFind}
            style={{ background: "#1a3d24", color: "white", border: "none", borderRadius: 4, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            Find
          </button>
          <button onClick={() => { setShowFindBar(false); setFindTerm(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#aaa", lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RULER
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#f2f2f2", borderBottom: "1px solid #ddd", height: 18, flexShrink: 0, display: "flex", alignItems: "flex-end", paddingLeft: showOutline ? 248 : 8, overflow: "hidden", position: "relative" }}>
        <div style={{ flex: 1, position: "relative", height: "100%" }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: i * 54, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i > 0 && <span style={{ fontSize: 7, color: "#999", lineHeight: 1 }}>{i}</span>}
              <div style={{ width: 1, height: i % 2 === 0 ? 7 : 4, background: "#bbb" }} />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── OUTLINE SIDEBAR ─────────────────────────────────────────── */}
        {showOutline && (
          <aside style={{ width: 240, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: "0.05em", textTransform: "uppercase" }}>OUTLINE</span>
                <button onClick={() => setShowOutline(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0 }}>✕</button>
              </div>
              {/* Single tab — Pages removed */}
              <div style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: 0 }}>
                <span style={{ display: "inline-block", padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#1a3d24", borderBottom: "2px solid #1a3d24", marginBottom: -1 }}>SBA Outline</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
              {SBA_SECTIONS.map((section, i) => {
                const s = sectionStatus[i];
                const active = activeSection === section;
                return (
                  <div key={section} onClick={() => setActiveSection(section)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 16px",
                      cursor: "pointer",
                      background: active ? "rgba(26,61,36,0.07)" : "transparent",
                      borderLeft: active ? "3px solid #1a3d24" : "3px solid transparent",
                    }}>
                    <StatusIcon s={s} />
                    <span style={{ fontSize: 12, color: active ? "#1a3d24" : "#444", fontWeight: active ? 600 : 400 }}>{section}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
              <button
                onClick={() => showToast(`SBA: ${doneCount}/${SBA_SECTIONS.length} sections complete (${progress}%) — Keep going, Lion! 🦁`)}
                style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg, #1a3d24, #0d2b14)", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                🛡️ SBA Checker
              </button>
            </div>
          </aside>
        )}

        {/* ── DOCUMENT CANVAS ─────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", background: "#e0e0e0", padding: "24px 16px" }}>
          <div style={{ maxWidth: 816, margin: "0 auto", boxShadow: "0 2px 16px rgba(0,0,0,0.18)" }}>
            <div
              style={{ background: pageColor, padding: "96px 96px 120px", minHeight: 1056, boxSizing: "border-box", transition: "background 0.3s" }}
              onClick={() => editorRef.current?.focus()}
            >
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
          <aside style={{ width: 280, background: "#fff", borderLeft: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase" }}>Lion Assistant</span>
              <button onClick={() => setShowAssistant(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <div style={{ padding: "14px 14px 8px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Hi {title ? title.split(" ")[0] : "there"}! 👋</p>
              <p style={{ fontSize: 11, color: "#777", marginTop: 4, marginBottom: 0 }}>How can I help improve your writing?</p>
            </div>

            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {ASSISTANT_ACTIONS.map(({ icon, label, color }) => (
                <button key={label}
                  onClick={() => showToast("AI writing tools coming soon! 🦁")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 12, color: "#333", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f8f8f8")}
                >
                  <span style={{ fontSize: 15, color, flexShrink: 0, width: 22, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* SBA Checker panel */}
            <div style={{ margin: "14px 12px 0", borderTop: "1px solid #eee", paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>SBA Checker</p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Gauge pct={progress} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: progress >= 75 ? "#059669" : "#f59e0b", margin: 0 }}>
                    {progress >= 75 ? "Good progress!" : "Keep going!"}
                  </p>
                  <p style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}>{doneCount}/{SBA_SECTIONS.length} sections done</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SBA_SECTIONS.map((section, i) => (
                  <div key={section} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#444" }}>{section}</span>
                    <StatusIcon s={sectionStatus[i]} />
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, marginTop: 10 }}>
                {SBA_SECTIONS.length - doneCount} sections need attention
              </p>
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
        <span>English (Jamaica)</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Text Predictions: On</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>♿ Accessibility: Good to go</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowOutline(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showOutline ? "Hide Outline" : "Show Outline"}
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
        [contenteditable] blockquote {
          border-left:3px solid #1a3d24; padding-left:14px; margin:10px 0;
          color:#555; font-style:italic;
        }
        [contenteditable] table { border-collapse:collapse; width:100%; margin:8px 0; }
        [contenteditable] td, [contenteditable] th {
          border:1px solid #ccc; padding:6px 8px; min-width:60px;
        }
        [contenteditable] a { color:#1a3d24; text-decoration:underline; }
        [contenteditable]:empty:before { content:attr(placeholder); color:#bbb; pointer-events:none; }
      `}</style>
    </div>
  );
}
