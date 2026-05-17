"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";

export function DocEditor({
  id,
  initialTitle,
  initialBody,
}: {
  id: string;
  initialTitle: string;
  initialBody: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  const { status, error } = useAutosave(
    { title, body },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({ title: v.title, body: v.body })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
  );

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
          className="w-full bg-transparent font-display text-3xl font-bold focus:outline-none"
        />
        <SaveStatusPill status={status} error={error} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
        <span>{wordCount} words</span>
        <span>·</span>
        <span>{body.length} characters</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing your document…"
        rows={28}
        className="mt-6 w-full resize-y bg-transparent text-base leading-relaxed focus:outline-none"
      />
    </div>
  );
}
