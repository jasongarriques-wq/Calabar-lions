"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  CircleDollarSign,
  Hash,
  Percent,
  Sigma,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import {
  ToolShell,
  RibbonGroup,
  RibbonIcon,
  type ToolShellAuthor,
} from "@/components/tool-shell";

type Cells = Record<string, string>;

const TABS = ["File", "Home", "Insert", "Formulas", "Data", "View", "Help"];

const colLetter = (n: number) => {
  let s = "";
  let i = n;
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
};

function colIndex(letters: string) {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

function parseRange(argsStr: string, cells: Cells, depth: number): string[] {
  return argsStr.split(",").flatMap((arg) => {
    const part = arg.trim();
    const m = part.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (m) {
      const [, c1, r1, c2, r2] = m;
      const colA = colIndex(c1);
      const colB = colIndex(c2);
      const rowA = Number(r1);
      const rowB = Number(r2);
      const out: string[] = [];
      for (let r = Math.min(rowA, rowB); r <= Math.max(rowA, rowB); r++) {
        for (let c = Math.min(colA, colB); c <= Math.max(colA, colB); c++) {
          const ref = `${colLetter(c)}${r}`;
          const v = cells[ref];
          out.push(v ? evaluateCell(v, cells, depth + 1) : "");
        }
      }
      return out;
    }
    if (/^[A-Z]+\d+$/i.test(part)) {
      const v = cells[part.toUpperCase()];
      return [v ? evaluateCell(v, cells, depth + 1) : ""];
    }
    return [part];
  });
}

function evaluateCell(raw: string, cells: Cells, depth = 0): string {
  if (depth > 10 || !raw.startsWith("=")) return raw;
  const expr = raw.slice(1).trim();

  const fnMatch = expr.match(/^([A-Z]+)\(([^)]*)\)$/i);
  if (fnMatch) {
    const [, name, argsStr] = fnMatch;
    const args = parseRange(argsStr, cells, depth);
    const nums = args.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    switch (name.toUpperCase()) {
      case "SUM":
        return nums.reduce((a, b) => a + b, 0).toString();
      case "AVG":
      case "AVERAGE":
        return nums.length
          ? (nums.reduce((a, b) => a + b, 0) / nums.length).toString()
          : "0";
      case "MIN":
        return nums.length ? Math.min(...nums).toString() : "";
      case "MAX":
        return nums.length ? Math.max(...nums).toString() : "";
      case "COUNT":
        return nums.length.toString();
    }
  }

  const replaced = expr.replace(/[A-Z]+\d+/g, (ref) => {
    const v = cells[ref];
    const evaluated = v ? evaluateCell(v, cells, depth + 1) : "0";
    const num = Number(evaluated);
    return Number.isFinite(num) ? num.toString() : "0";
  });
  if (!/^[\d+\-*/().\s]+$/.test(replaced)) return "#ERR";
  try {
    const result = Function(`"use strict"; return (${replaced})`)();
    return typeof result === "number" && Number.isFinite(result) ? result.toString() : "#ERR";
  } catch {
    return "#ERR";
  }
}

export function SheetEditor({
  id,
  initialTitle,
  initialCells,
  rows,
  cols,
  author,
  canEdit,
}: {
  id: string;
  initialTitle: string;
  initialCells: Cells;
  rows: number;
  cols: number;
  author: ToolShellAuthor;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [cells, setCells] = useState<Cells>(initialCells);
  const [active, setActive] = useState<string | null>(null);
  const [tab, setTab] = useState("Home");
  const [zoom, setZoom] = useState(100);

  const { status } = useAutosave(
    { title, cells },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("spreadsheets")
        .update({ title: v.title, cells: v.cells })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    { enabled: canEdit },
  );

  const computed = useMemo(() => {
    const out: Cells = {};
    for (const [k, v] of Object.entries(cells)) out[k] = evaluateCell(v, cells);
    return out;
  }, [cells]);

  function quickFormula(name: "SUM" | "AVG" | "MIN" | "MAX" | "COUNT") {
    if (!active) {
      alert("Select a cell first.");
      return;
    }
    setCells((prev) => ({ ...prev, [active]: `=${name}(A1:A10)` }));
  }

  return (
    <ToolShell
      appName="Lion Sheets"
      appTagline="Crunch numbers like a Lion."
      badge="Spreadsheet"
      title={title}
      setTitle={canEdit ? setTitle : undefined}
      saveStatus={status}
      author={author}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      canEdit={canEdit}
      zoom={zoom}
      setZoom={setZoom}
      statusItems={
        <>
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            {active ?? "—"}
          </span>
          <span>
            {Object.keys(cells).length} cell{Object.keys(cells).length === 1 ? "" : "s"} filled
          </span>
        </>
      }
      toolbar={
        <>
          <RibbonGroup label="Formula">
            <RibbonIcon
              icon={Sigma}
              title="SUM"
              onClick={() => quickFormula("SUM")}
              disabled={!canEdit}
            />
            <RibbonIcon
              icon={Calculator}
              title="AVERAGE"
              onClick={() => quickFormula("AVG")}
              disabled={!canEdit}
            />
            <RibbonIcon
              icon={Hash}
              title="COUNT"
              onClick={() => quickFormula("COUNT")}
              disabled={!canEdit}
            />
          </RibbonGroup>
          <RibbonGroup label="Format">
            <RibbonIcon icon={CircleDollarSign} title="Currency" disabled={!canEdit} />
            <RibbonIcon icon={Percent} title="Percent" disabled={!canEdit} />
          </RibbonGroup>
          <RibbonGroup label="Formula bar">
            <input
              value={active ? cells[active] ?? "" : ""}
              onChange={(e) => active && setCells((p) => ({ ...p, [active]: e.target.value }))}
              disabled={!canEdit || !active}
              placeholder="fx — type a value or =SUM(A1:A5)"
              className="w-72 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs"
            />
          </RibbonGroup>
        </>
      }
    >
      <div className="min-h-0 flex-1 overflow-auto bg-white p-3 print:overflow-visible">
        <div
          className="mx-auto rounded-md border border-slate-200 bg-white shadow-sm"
          style={{ width: "min(100%, 1200px)", transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-500"></th>
                {Array.from({ length: cols }, (_, c) => (
                  <th
                    key={c}
                    className="border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                  >
                    {colLetter(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, r) => {
                const row = r + 1;
                return (
                  <tr key={row}>
                    <th className="border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                      {row}
                    </th>
                    {Array.from({ length: cols }, (_, c) => {
                      const ref = `${colLetter(c)}${row}`;
                      const raw = cells[ref] ?? "";
                      const display = active === ref ? raw : computed[ref] ?? raw;
                      return (
                        <td
                          key={ref}
                          className={`border-b border-r border-slate-200 p-0 ${
                            active === ref ? "outline outline-2 outline-calabar-green-500" : ""
                          }`}
                        >
                          <input
                            value={display}
                            onFocus={() => setActive(ref)}
                            onBlur={() => setActive(null)}
                            onChange={(e) =>
                              setCells((prev) => {
                                const v = e.target.value;
                                const next = { ...prev };
                                if (v === "") delete next[ref];
                                else next[ref] = v;
                                return next;
                              })
                            }
                            disabled={!canEdit}
                            className="w-full bg-transparent px-2 py-1 text-sm focus:bg-calabar-green-50 focus:outline-none disabled:opacity-80"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ToolShell>
  );
}
