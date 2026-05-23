export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import SBAProgressCard from "@/components/sba-progress-card";
import Link from "next/link";
import type { Profile, SBAProject } from "@/types";

export default async function SBAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: sbas }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sba_projects").select("*, subjects(*)").eq("student_id", (await supabase.from("profiles").select("id").eq("id", user.id).single()).data?.id).order("created_at", { ascending: false }),
  ]);

  const total = sbas?.length ?? 0;
  const completed = sbas?.filter((s: SBAProject) => s.status === "graded" || s.status === "submitted").length ?? 0;
  const avgProgress = total > 0 ? Math.round(sbas!.reduce((sum: number, s: SBAProject) => sum + s.progress, 0) / total) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">📊 SBA Tracker</h1>
            <p className="text-sm text-zinc-500">Track your School-Based Assessments</p>
          </div>
          <Link href="/sba/new" className="btn-primary">+ New SBA</Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total SBAs", value: total, icon: "📋" },
            { label: "Completed", value: completed, icon: "✅" },
            { label: "Avg Progress", value: `${avgProgress}%`, icon: "📈" },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="mt-1 text-2xl font-black text-green-400">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SBA list */}
        <div className="grid gap-4 sm:grid-cols-2">
          {(sbas as SBAProject[] ?? []).map(sba => <SBAProgressCard key={sba.id} sba={sba} />)}
          {total === 0 && (
            <div className="col-span-2 card py-16 text-center">
              <p className="text-4xl">📊</p>
              <p className="mt-3 font-black">No SBA projects yet</p>
              <p className="mt-1 text-sm text-zinc-500">Start tracking your first SBA project</p>
              <Link href="/sba/new" className="btn-primary mt-4 inline-block">+ Add SBA Project</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
