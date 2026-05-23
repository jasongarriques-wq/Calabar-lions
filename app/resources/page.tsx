export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile, Resource } from "@/types";

const fileIcons: Record<string, string> = { pdf: "📄", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊", mp4: "🎥", png: "🖼️", jpg: "🖼️" };

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: resources }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("resources").select("*, subjects(*), profiles(full_name, username)").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">📎 Resource Library</h1>
            <p className="text-sm text-zinc-500">Past papers, notes, and study guides</p>
          </div>
          <Link href="/resources/upload" className="btn-primary">+ Upload</Link>
        </div>

        {/* Filter by level */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["All", "CSEC", "CAPE", "PEP"].map(l => (
            <button key={l} className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-semibold hover:border-green-700 hover:text-green-400 transition-colors">
              {l}
            </button>
          ))}
        </div>

        {/* Resources grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(resources as Resource[] ?? []).map(r => {
            const ext = r.file_url.split(".").pop()?.toLowerCase() ?? "file";
            return (
              <div key={r.id} className="card hover:border-zinc-700 transition-colors space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{fileIcons[ext] ?? "📁"}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-sm truncate">{r.title}</h3>
                    {r.subjects && <p className="text-xs text-zinc-500">{r.subjects.name} · {r.subjects.level}</p>}
                  </div>
                </div>
                {r.description && <p className="text-xs text-zinc-400 line-clamp-2">{r.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">⬇️ {r.downloads} downloads</span>
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-3 py-1.5">
                    Download
                  </a>
                </div>
              </div>
            );
          })}
          {(!resources || resources.length === 0) && (
            <div className="col-span-3 card py-16 text-center">
              <p className="text-4xl">📎</p>
              <p className="mt-3 font-black">No resources yet</p>
              <p className="mt-1 text-sm text-zinc-500">Be the first to upload a study resource</p>
              <Link href="/resources/upload" className="btn-primary mt-4 inline-block">Upload Resource</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
