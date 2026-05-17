"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { SaveStatusPill } from "@/components/save-status";

export function NoteEditor({
  id,
  initialTitle,
  initialBody,
  initialSubject,
}: {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialSubject: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [subject, setSubject] = useState(initialSubject);

  const { status, error } = useAutosave(
    { title, body, subject },
    async (v) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({ title: v.title, body: v.body, subject: v.subject || null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
  );

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full bg-transparent text-2xl font-bold focus:outline-none"
        />
        <SaveStatusPill status={status} error={error} />
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (optional)"
        className="mt-2 w-full bg-transparent text-sm text-stone-600 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing…"
        rows={20}
        className="mt-6 w-full resize-y bg-transparent text-base leading-relaxed focus:outline-none"
      />
    </div>
  );
}
