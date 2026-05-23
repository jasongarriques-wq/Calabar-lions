"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function NewGroupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", type: "general", is_private: false });

  const groupTypes = ["general", "subject", "club", "sport", "sba", "form", "class"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error: err } = await supabase.from("groups").insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      is_private: form.is_private,
      created_by: user.id,
    }).select().single();

    if (err) { setError(err.message); setLoading(false); return; }

    // Auto-join as leader
    await supabase.from("group_members").insert({ group_id: data.id, profile_id: user.id, role: "leader" });
    router.push(`/groups/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <main className="mx-auto max-w-lg px-4 py-12">
        <Link href="/groups" className="text-sm text-zinc-500 hover:text-zinc-300 mb-6 inline-block">← Back to Groups</Link>
        <h1 className="text-2xl font-black mb-6">Create a Group</h1>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

          <div>
            <label className="label">Group Name</label>
            <input className="input" placeholder="e.g. CSEC Mathematics Study Group" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="What&apos;s this group about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className="label">Group Type</label>
            <div className="grid grid-cols-3 gap-2">
              {groupTypes.map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`rounded-xl border p-2.5 text-xs font-semibold capitalize transition-colors ${form.type === t ? "border-green-600 bg-green-950 text-green-300" : "border-zinc-700 hover:border-zinc-600"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="private" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} className="h-4 w-4 rounded" />
            <label htmlFor="private" className="text-sm font-semibold">Private group (invite only)</label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </main>
    </div>
  );
}
