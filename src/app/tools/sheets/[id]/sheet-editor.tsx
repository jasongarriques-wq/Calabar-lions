"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";

type Cells = Record<string, string>;

const colLetter = (n: number) => {
  let s = "";
  let i = n;
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
};

function evaluateCell(raw: string, cells: Cells, depth = 0): string {
  if (depth > 10 || !raw.startsWith("=")) return raw;
  const expr = raw.slice(1).trim();

  const fnMatch = expr.match(/^([A-Z]+)\(([^)]*)\)$/i);
  if (fnMatch) {
    const [, name, argsStr] = fnMatch;
    const args = parseRange(argsStr, cells, depth);
    const nums = args
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
    switch (name.toUpperCase()) {
      case "SUM":
        return nums.reduce((a, b) => a + b, 0).toString();
      case "AVG":
      case "AVERAGE":
        return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toString() : "0";
      case "MIN":
        return nums.length ? Math.min(...nums).toString() : "";
      case "MAX":
        return nums.length ? Math.max(...nums).toString() : "";
      case "COUNT":
        return nums.length.toString();
    }
  }

  // Simple arithmetic with cell refs
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

function colIndex(letters: string) {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

export function SheetEditor({
  id,
  initialTitle,
  initialCells,
  rows,
  cols,
}: {
  id: string;
  initialTitle: string;
  initialCells: Cells;
  rows: number;
  cols: number;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [cells, setCells] = useState<Cells>(initialCells);
  const [active, setActive] = useState<string | null>(null);

  const { status, error } = useAutosave({ title, cells }, async (v) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("spreadsheets")
      .update({ title: v.title, cells: v.cells })
      .eq("id", id);
    if (error) throw new Error(error.message);
  });

  const computed = useMemo(() => {
    const out: Cells = {};
    for (const [k, v] of Object.entries(cells)) {
      out[k] = evaluateCell(v, cells);
    }
    return out;
  }, [cells]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sheet title"
          className="w-full bg-transparent text-2xl font-bold focus:outline-none"
        />
        <SaveStatusPill status={status} error={error} />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Tip: start a cell with <code>=</code> for a formula. Try{" "}
        <code>=SUM(A1:A5)</code>, <code>=AVG(B1:B10)</code>, or <code>=A1+B1</code>.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 border-b border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-500"></th>
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  className="border-b border-l border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-600"
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
                  <th className="border-b border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-500">
                    {row}
                  </th>
                  {Array.from({ length: cols }, (_, c) => {
                    const ref = `${colLetter(c)}${row}`;
                    const raw = cells[ref] ?? "";
                    const display = active === ref ? raw : computed[ref] ?? raw;
                    return (
                      <td
                        key={ref}
                        className="border-b border-l border-stone-200 p-0"
                      >
                        <input
                          value={display}
                          onFocus={() => setActive(ref)}
                          onBlur={() => setActive(null)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCells((prev) => {
                              const next = { ...prev };
                              if (v === "") delete next[ref];
                              else next[ref] = v;
                              return next;
                            });
                          }}
                          className="w-full bg-transparent px-2 py-1 text-sm focus:bg-calabar-green-50 focus:outline-none"
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
  );
}
