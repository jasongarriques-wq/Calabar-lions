export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile, Group } from "@/types";

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: formGroups }, { data: classGroups }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("groups").select("*").eq("type", "form").order("name"),
    supabase.from("groups").select("*").eq("type", "class").order("name"),
  ]);

  if (!profile) redirect("/signup");

  const forms = ["1", "2", "3", "4", "5", "6L", "6U"];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">📚 Classes</h1>
          <p className="text-sm text-zinc-500">Browse form groups and class divisions</p>
        </div>

        {/* My form highlight */}
        {profile.form && (
          <div className="mb-6 rounded-2xl border border-green-800 bg-green-950/30 p-4 flex items-center gap-3">
            <span className="text-2xl">📓</span>
            <div>
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Your Form</p>
              <p className="font-black">Form {profile.form}</p>
            </div>
            {formGroups?.find((g: Group) => g.name.includes(profile.form!)) && (
              <Link href={`/groups/${formGroups.find((g: Group) => g.name.includes(profile.form!))!.id}`} className="ml-auto btn-secondary text-xs">View Group</Link>
            )}
          </div>
        )}

        {/* Forms */}
        <h2 className="font-black mb-3">Form Groups</h2>
        {formGroups && formGroups.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {(formGroups as Group[]).map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}
                className="card flex items-center gap-4 hover:border-green-700 transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-800 to-zinc-800 font-black">
                  {g.name.replace(/[^0-9A-Za-z]/g, "").slice(0, 2)}
                </div>
                <div>
                  <p className="font-black">{g.name}</p>
                  <p className="text-xs text-zinc-500">{g.member_count} members</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {forms.map(f => (
              <div key={f} className="card text-center py-4 opacity-50">
                <p className="font-black">Form {f}</p>
                <p className="text-xs text-zinc-500">Group not set up yet</p>
              </div>
            ))}
          </div>
        )}

        {/* Class groups */}
        {classGroups && classGroups.length > 0 && (
          <>
            <h2 className="font-black mb-3">Class Divisions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(classGroups as Group[]).map(g => (
                <Link key={g.id} href={`/groups/${g.id}`}
                  className="card flex items-center gap-4 hover:border-green-700 transition-colors">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-800 to-zinc-800 font-black text-sm">
                    {g.name.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-black">{g.name}</p>
                    <p className="text-xs text-zinc-500">{g.member_count} members</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
