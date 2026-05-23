"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  options: { delayMs?: number; enabled?: boolean } = {},
) {
  const { delayMs = 1000, enabled = true } = options;
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const initial = useRef(true);
  const lastSaved = useRef(value);

  useEffect(() => {
    if (!enabled) return;
    if (initial.current) {
      initial.current = false;
      lastSaved.current = value;
      return;
    }
    if (Object.is(value, lastSaved.current)) return;

    const t = setTimeout(async () => {
      setStatus("saving");
      setError(null);
      try {
        await save(value);
        lastSaved.current = value;
        setStatus("saved");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
        setStatus("error");
      }
    }, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { status, error };
}
