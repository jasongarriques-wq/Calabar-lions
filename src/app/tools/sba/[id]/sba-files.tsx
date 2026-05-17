"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FileRow = {
  id: string;
  title: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

const MAX_BYTES = 50 * 1024 * 1024;

export function SbaFiles({
  sbaId,
  ownerId,
  canUpload,
}: {
  sbaId: string;
  ownerId: string;
  canUpload: boolean;
}) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("sba_files")
        .select("id, title, storage_path, mime_type, size_bytes, created_at")
        .eq("sba_id", sbaId)
        .order("created_at", { ascending: false });
      if (active) {
        setFiles((data as FileRow[] | null) ?? []);
        setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [sbaId]);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Pick a file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Max 50 MB.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${ownerId}/${sbaId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("sba-files")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setError(upErr.message);
      setPending(false);
      return;
    }
    const { data: row, error: insErr } = await supabase
      .from("sba_files")
      .insert({
        sba_id: sbaId,
        owner_id: ownerId,
        title: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
      })
      .select("id, title, storage_path, mime_type, size_bytes, created_at")
      .single();
    setPending(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setFiles((prev) => [row as FileRow, ...prev]);
    form.reset();
  }

  async function remove(f: FileRow) {
    if (!confirm(`Delete ${f.title}?`)) return;
    const supabase = createClient();
    await supabase.storage.from("sba-files").remove([f.storage_path]);
    await supabase.from("sba_files").delete().eq("id", f.id);
    setFiles((prev) => prev.filter((p) => p.id !== f.id));
  }

  async function openFile(f: FileRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("sba-files")
      .createSignedUrl(f.storage_path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="card mt-6">
      <h2 className="font-semibold">Research files</h2>
      <p className="mt-1 text-sm text-stone-600">
        Photos, PDFs, datasets, audio &mdash; anything that supports the project.
      </p>

      {canUpload && (
        <form onSubmit={onUpload} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-calabar-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-calabar-green-800 sm:w-auto sm:flex-1"
          />
          <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
            <Upload className="h-4 w-4" />
            {pending ? "Uploading…" : "Add file"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <ul className="mt-5 divide-y divide-stone-100">
        {!loaded && <li className="py-3 text-sm text-stone-500">Loading…</li>}
        {loaded && files.length === 0 && (
          <li className="py-3 text-sm text-stone-500">No files yet.</li>
        )}
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-3">
            <button
              type="button"
              onClick={() => openFile(f)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left hover:underline"
            >
              <FileText className="h-5 w-5 flex-none text-calabar-green-700" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.title}</p>
                <p className="text-xs text-stone-500">
                  {prettyBytes(f.size_bytes ?? 0)} · {new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
            {canUpload && (
              <button
                type="button"
                onClick={() => remove(f)}
                className="text-stone-400 hover:text-red-700"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
