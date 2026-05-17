"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const KINDS = [
  { value: "past_paper", label: "Past paper" },
  { value: "notes", label: "Study notes" },
  { value: "video", label: "Video" },
  { value: "link", label: "External link" },
];

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export function ResourceUploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState("past_paper");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const linkUrl = String(data.get("url") ?? "").trim();
    const file = data.get("file") as File | null;

    if (!title || !subject) {
      setError("Title and subject are required.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let url = linkUrl;
    let storagePath: string | null = null;

    if (kind !== "link") {
      if (!file || file.size === 0) {
        setError("Please choose a file.");
        setPending(false);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File is larger than 50 MB.");
        setPending(false);
        return;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      storagePath = `${subject.toLowerCase().replace(/\s+/g, "-")}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("resources")
        .upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
      if (upErr) {
        setError(upErr.message);
        setPending(false);
        return;
      }
      url = supabase.storage.from("resources").getPublicUrl(storagePath).data.publicUrl;
    } else if (!linkUrl) {
      setError("Please paste a link.");
      setPending(false);
      return;
    }

    const { error: insErr } = await supabase.from("resources").insert({
      title,
      subject,
      kind,
      url,
      storage_path: storagePath,
      uploader_id: user?.id,
      approved: true,
    });
    if (insErr) {
      setError(insErr.message);
      setPending(false);
      return;
    }

    setMessage("Uploaded.");
    setPending(false);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-calabar-green-800">Upload a resource</h2>
        <p className="text-sm text-stone-600">
          Past papers, notes, videos, or external links &mdash; visible to every signed-in Lion.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input id="title" name="title" required className="input" />
        </div>
        <div>
          <label htmlFor="subject" className="label">Subject</label>
          <input id="subject" name="subject" required className="input" placeholder="e.g. Mathematics" />
        </div>
      </div>

      <div>
        <label htmlFor="kind" className="label">Type</label>
        <select id="kind" name="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      {kind === "link" ? (
        <div>
          <label htmlFor="url" className="label">Link URL</label>
          <input id="url" name="url" type="url" required className="input" placeholder="https://…" />
        </div>
      ) : (
        <div>
          <label htmlFor="file" className="label">File</label>
          <input
            id="file"
            name="file"
            type="file"
            required
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-calabar-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-calabar-green-800"
          />
          <p className="mt-1 text-xs text-stone-500">Max 50 MB. PDFs, images, or video.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-calabar-green-700">{message}</p>}

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        <Upload className="h-4 w-4" />
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
