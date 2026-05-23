"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/navbar";
import type { Profile } from "@/types";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: "", bio: "", grade: "", house: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) { setProfile(data); setForm({ full_name: data.full_name, bio: data.bio ?? "", grade: data.grade ?? "", house: data.house ?? "" }); }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update(form).eq("id", profile.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10 (Form 4)", "Grade 11 (Form 5)", "Lower 6", "Upper 6"];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-black">⚙️ Settings</h1>
        <form onSubmit={handleSave} className="card space-y-5">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[100px] resize-none" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the pride about yourself..." />
          </div>
          <div>
            <label className="label">Grade / Form</label>
            <select className="input" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}>
              <option value="">Select grade</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">House</label>
            <input className="input" value={form.house} onChange={e => setForm(p => ({ ...p, house: e.target.value }))} placeholder="e.g. Manning, Carib, Arawak..." />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h2 className="mb-3 font-black text-sm">🔒 Privacy</h2>
            <div className="space-y-2 text-sm text-zinc-400">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Show my profile to all Lions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Allow direct messages</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Hide my SBA progress from others</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
            {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}
