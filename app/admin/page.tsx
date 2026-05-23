export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import type { Profile } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !["school_admin", "group_admin"].includes(profile.role)) redirect("/dashboard");

  const [{ data: reports }, { data: users }, { data: posts }] = await Promise.all([
    supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const stats = [
    { label: "Pending Reports", value: reports?.length ?? 0, icon: "🚨", color: "text-red-400" },
    { label: "Total Users", value: users?.length ?? 0, icon: "👥", color: "text-blue-400" },
    { label: "Recent Posts", value: posts?.length ?? 0, icon: "📝", color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">🛡️ Admin Dashboard</h1>
          <p className="text-sm text-zinc-500">Moderation and platform management</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Reports */}
          <div>
            <h2 className="mb-3 font-black">🚨 Pending Reports</h2>
            <div className="space-y-3">
              {reports && reports.length > 0 ? reports.map((r: any) => (
                <div key={r.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-red-950 px-2 py-0.5 text-xs font-semibold text-red-300 capitalize">{r.target_type}</span>
                    <span className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{r.reason}</p>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs px-3 py-1.5">Dismiss</button>
                    <button className="rounded-xl bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-800">Remove</button>
                  </div>
                </div>
              )) : (
                <div className="card py-8 text-center">
                  <p className="text-sm text-zinc-500">✅ No pending reports</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div>
            <h2 className="mb-3 font-black">👥 Recent Users</h2>
            <div className="space-y-2">
              {users?.map((u: Profile) => (
                <div key={u.id} className="card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 font-black text-sm">
                      {(u.full_name ?? u.display_name ?? "L")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black">{u.full_name}</p>
                      <p className="text-xs text-zinc-500">@{u.display_name ?? u.full_name ?? "Lion"} · {String(u.role).replace("_", " ")}</p>
                    </div>
                  </div>
                  <button className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Suspend</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
