"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ROWS = 30;

type SheetData = { rows: string[][]; cols: string[] };

function defaultData(): SheetData {
  return {
    rows: Array.from({ length: ROWS }, () => Array(10).fill("")),
    cols: COLS,
  };
}

function evalCell(value: string, rows: string[][]): string {
  if (!value.startsWith("=")) return value;
  const formula = value.slice(1).toUpperCase().trim();
  const sumMatch = formula.match(/^SUM\(([A-J])(\d+):([A-J])(\d+)\)$/);
  if (sumMatch) {
    const c1 = COLS.indexOf(sumMatch[1]), r1 = parseInt(sumMatch[2]) - 1;
    const c2 = COLS.indexOf(sumMatch[3]), r2 = parseInt(sumMatch[4]) - 1;
    let sum = 0;
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++) {
        const v = parseFloat(rows[r]?.[c] ?? "");
        if (!isNaN(v)) sum += v;
      }
    return String(sum);
  }
  const avgMatch = formula.match(/^AVERAGE\(([A-J])(\d+):([A-J])(\d+)\)$/);
  if (avgMatch) {
    const c1 = COLS.indexOf(avgMatch[1]), r1 = parseInt(avgMatch[2]) - 1;
    const c2 = COLS.indexOf(avgMatch[3]), r2 = parseInt(avgMatch[4]) - 1;
    const vals: number[] = [];
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++) {
        const v = parseFloat(rows[r]?.[c] ?? "");
        if (!isNaN(v)) vals.push(v);
      }
    return vals.length ? String(vals.reduce((a, b) => a + b, 0) / vals.length) : "0";
  }
  return value;
}

const MENU_TABS = ["File", "Home", "Insert", "Data", "Formulas", "Review", "View"];

const ASSISTANT_ACTIONS = [
  { icon: "📈", label: "Analyze this data",      color: "#059669" },
  { icon: "🔢", label: "Calculate statistics",   color: "#2563eb" },
  { icon: "📊", label: "Suggest a chart type",   color: "#7c3aed" },
  { icon: "🔍", label: "Find patterns & trends", color: "#dc2626" },
  { icon: "✅", label: "Check for errors",        color: "#ea580c" },
  { icon: "📋", label: "Format as table",         color: "#0891b2" },
];

const QUICK_FNS = [
  { name: "SUM",     example: "=SUM(A1:A10)"     },
  { name: "AVERAGE", example: "=AVERAGE(A1:A10)" },
  { name: "COUNT",   example: "=COUNT(A1:A10)"   },
  { name: "MAX",     example: "=MAX(A1:A10)"     },
  { name: "MIN",     example: "=MIN(A1:A10)"     },
];

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "none", border: "none", cursor: "pointer", color: "#333",
  borderRadius: 3, fontSize: 11, padding: "2px 5px", lineHeight: 1.3,
  display: "flex", alignItems: "center", gap: 3, ...extra,
});
const sep: React.CSSProperties = {
  width: 1, height: 36, background: "#e0e0e0", flexShrink: 0, margin: "0 4px",
};

export default function SheetEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [sheetId, setSheetId] = useState("");
  const [title, setTitle]     = useState("Untitled Sheet");
  const [data, setData]       = useState<SheetData>(defaultData());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [saved, setSaved]     = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu]       = useState("Home");
  const [showPanel, setShowPanel]         = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase  = createClient();
  const router    = useRouter();

  useEffect(() => { params.then(({ id }) => setSheetId(id)); }, [params]);

  useEffect(() => {
    if (!sheetId) return;
    (async () => {
      const { data: sheet, error } = await supabase.from("spreadsheets").select("*").eq("id", sheetId).single();
      if (error || !sheet) { router.push("/tools/sheets"); return; }
      setTitle(sheet.title ?? "Untitled Sheet");
      const loaded = sheet.data as SheetData | null;
      setData(loaded?.rows ? loaded : defaultData());
      setLoading(false);
    })();
  }, [sheetId]);

  const scheduleSave = useCallback((t: string, d: SheetData) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("spreadsheets").update({ title: t, data: d }).eq("id", sheetId);
      setSaved(true);
    }, 1500);
  }, [sheetId, supabase]);

  function updateCell(row: number, col: number, value: string) {
    const newRows = data.rows.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
    );
    const newData = { ...data, rows: newRows };
    setData(newData);
    scheduleSave(title, newData);
  }

  function exportCsv() {
    const csv = data.rows.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([COLS.join(",") + "\n" + csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${title}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const selectedLabel = selected ? `${COLS[selected[1]]}${selected[0] + 1}` : "";
  const selectedValue = selected ? data.rows[selected[0]]?.[selected[1]] ?? "" : "";

  // Compute column sums for footer stats
  const filledCells = data.rows.flat().filter(c => c !== "").length;

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3d24" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Loading sheet…</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f5f5f5" }}>

      {/* ══════════════════════════════════════════════════════════════════
          TOP BAR — dark green
      ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "#1a3d24", color: "white", height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", flexShrink: 0 }}>
        <Link href="/tools/sheets" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 6 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>📊</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>LION SHEETS</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>Data doesn&apos;t lie. Organise yours.</div>
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
            onChange={e => { setTitle(e.target.value); scheduleSave(e.target.value, data); }}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 14, fontWeight: 600, textAlign: "center", padding: "2px 8px", minWidth: 220, outline: "none" }}
            placeholder="Sheet title"
          />
          <span style={{ fontSize: 11, opacity: 0.65 }}>
            {saved ? <>☁ Saved</> : <span style={{ color: "#fbbf24" }}>Saving…</span>}
          </span>
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={exportCsv}
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            ⬇ CSV
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
          <button onClick={exportCsv} style={{ background: "#059669", color: "white", border: "none", borderRadius: 4, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export ▾</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FORMULA BAR TOOLBAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 0, padding: "2px 8px", flexShrink: 0, height: 50, overflowX: "auto" }}>
        {/* Number format */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <select style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 4px", height: 22, color: "#333", width: 110 }}>
            <option>General</option>
            <option>Number</option>
            <option>Currency (JMD)</option>
            <option>Percentage</option>
            <option>Date</option>
            <option>Text</option>
          </select>
        </div>
        <div style={sep} />

        {/* Font */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <select style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 100 }}>
            <option>Calibri</option>
            <option>Arial</option>
            <option>Times New Roman</option>
          </select>
          <select defaultValue="11" style={{ fontSize: 11, border: "1px solid #ccc", borderRadius: 3, padding: "1px 3px", height: 22, color: "#333", width: 40 }}>
            {[8,9,10,11,12,14,16].map(s => <option key={s}>{s}</option>)}
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
          <button style={btn()} title="Align Left">≡⬅</button>
          <button style={btn()} title="Center">≡</button>
          <button style={btn()} title="Align Right">≡➡</button>
          <div style={{ width: 1, background: "#ddd", margin: "0 3px", height: 20 }} />
          <button style={btn()} title="Wrap Text">↵</button>
          <button style={btn()} title="Merge Cells">⊞</button>
        </div>
        <div style={sep} />

        {/* Cell style */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
          <button style={{ ...btn(), padding: "3px 8px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3 }}>🎨 Fill</button>
          <button style={{ ...btn(), padding: "3px 8px", border: "1px solid #e0e0e0", background: "#f9f9f9", borderRadius: 3 }}>🔲 Borders</button>
        </div>
        <div style={sep} />

        {/* Formula bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, padding: "0 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 11, color: "#555" }}>fx</span>
            <span style={{ background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 3, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", minWidth: 40, textAlign: "center", color: "#1a3d24", fontWeight: 700 }}>
              {selectedLabel || "—"}
            </span>
          </div>
          <input
            style={{ flex: 1, border: "1px solid #ccc", borderRadius: 3, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", outline: "none", height: 22 }}
            value={selectedValue}
            placeholder="Select a cell to edit…"
            onChange={e => { if (selected) updateCell(selected[0], selected[1], e.target.value); }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL — Quick Functions ─────────────────────────────── */}
        {showPanel && (
          <aside style={{ width: 210, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: "0.05em", textTransform: "uppercase" }}>Functions</span>
              <button onClick={() => setShowPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <div style={{ padding: "8px 12px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Quick Formulas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {QUICK_FNS.map(({ name, example }) => (
                  <div key={name}
                    onClick={() => { if (selected) { updateCell(selected[0], selected[1], `=${name}(`); } }}
                    style={{ border: "1px solid #eee", borderRadius: 6, padding: "6px 9px", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24" }}>{name}</div>
                    <div style={{ fontSize: 9, color: "#888", fontFamily: "monospace", marginTop: 2 }}>{example}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "0 12px", marginTop: 4 }}>
              <div style={{ height: 1, background: "#eee", marginBottom: 10 }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Sheet Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Rows",         value: ROWS },
                  { label: "Columns",      value: COLS.length },
                  { label: "Filled cells", value: filledCells },
                  { label: "Selected",     value: selectedLabel || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 12, marginTop: "auto", borderTop: "1px solid #eee" }}>
              <Link href="/tools/sheets"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "9px 0", background: "linear-gradient(135deg, #1a3d24, #0d2b14)", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                ← All Sheets
              </Link>
            </div>
          </aside>
        )}

        {/* ── SPREADSHEET GRID ─────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "auto", background: "#f5f5f5" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 40, border: "1px solid #d0d0d0", background: "#f0f0f0", padding: "4px 8px", textAlign: "center", color: "#666", position: "sticky", top: 0, zIndex: 2 }} />
                {COLS.map(col => (
                  <th key={col} style={{ width: 110, border: "1px solid #d0d0d0", background: "#f0f0f0", padding: "4px 8px", textAlign: "center", fontWeight: 700, color: "#1a3d24", fontSize: 11, position: "sticky", top: 0, zIndex: 2 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ border: "1px solid #d0d0d0", background: "#f0f0f0", padding: "2px 8px", textAlign: "center", color: "#888", fontSize: 11, userSelect: "none", fontWeight: 600 }}>
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => {
                    const isSelected = selected?.[0] === ri && selected?.[1] === ci;
                    const displayed  = evalCell(cell, data.rows);
                    return (
                      <td key={ci}
                        style={{ border: "1px solid #d0d0d0", padding: 0, background: isSelected ? "#e8f5e9" : "white", outline: isSelected ? "2px solid #1a3d24" : "none", outlineOffset: -1 }}
                        onClick={() => setSelected([ri, ci])}>
                        <input
                          style={{ height: 26, width: 110, background: "transparent", padding: "0 6px", fontSize: 12, color: "#1a1a1a", border: "none", outline: "none", fontFamily: "inherit" }}
                          value={isSelected ? cell : displayed}
                          onChange={e => updateCell(ri, ci, e.target.value)}
                          onFocus={() => setSelected([ri, ci])}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        {/* ── LION ASSISTANT SIDEBAR ──────────────────────────────────── */}
        {showAssistant && (
          <aside style={{ width: 260, background: "#fff", borderLeft: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase" }}>Lion Assistant</span>
              <button onClick={() => setShowAssistant(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: 0 }}>✕</button>
            </div>

            <div style={{ padding: "14px 14px 8px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Data insights! 🦁</p>
              <p style={{ fontSize: 11, color: "#777", marginTop: 4, marginBottom: 0 }}>Let me help you understand your data.</p>
            </div>

            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {ASSISTANT_ACTIONS.map(({ icon, label, color }) => (
                <button key={label}
                  onClick={() => alert("AI data tools coming soon! 🦁")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 12, color: "#333", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f8f8f8")}
                >
                  <span style={{ fontSize: 15, color, flexShrink: 0, width: 22, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Selected cell info */}
            {selected && (
              <div style={{ margin: "14px 12px 0", borderTop: "1px solid #eee", paddingTop: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#1a3d24", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Cell: {selectedLabel}</p>
                <div style={{ background: "#f8f8f8", border: "1px solid #eee", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>Value</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#1a3d24", fontWeight: 600, wordBreak: "break-all" }}>
                    {selectedValue || <span style={{ color: "#bbb" }}>empty</span>}
                  </div>
                  {selectedValue !== evalCell(selectedValue, data.rows) && (
                    <>
                      <div style={{ fontSize: 10, color: "#888", marginTop: 6, marginBottom: 3 }}>Result</div>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                        {evalCell(selectedValue, data.rows)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATUS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#1a3d24", color: "rgba(255,255,255,0.75)", height: 22, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", fontSize: 10, flexShrink: 0 }}>
        <span>Cell: {selectedLabel || "—"}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{filledCells} cells filled</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{ROWS} rows × {COLS.length} columns</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>English (Jamaica)</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowPanel(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showPanel ? "Hide Panel" : "Show Panel"}
          </button>
          <button onClick={() => setShowAssistant(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 10, textDecoration: "underline" }}>
            {showAssistant ? "Hide Assistant" : "Show Assistant"}
          </button>
          <span style={{ opacity: 0.5 }}>─ 100% +</span>
        </div>
      </footer>
    </div>
  );
}
