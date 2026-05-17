import { Navbar } from "@/components/navbar";
import { CalabarStudentCard } from "@/components/calabar-student-card";
import { SbaProgressCard } from "@/components/sba-progress-card";
import { ResourceCard } from "@/components/resource-card";
import { GuestUpgradeBanner } from "@/components/guest-upgrade-banner";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  role: string | null;
  form: string | null;
  grade: number | null;
  class_group: string | null;
  academic_year: string | null;
  graduating_year: number | null;
  track: string | null;
  sport: string | null;
  club: string | null;
  house_id: string | null;
  houses?: { id: string; name: string; color: string | null } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, display_name, role, form, grade, class_group, academic_year, graduating_year, track, sport, club, house_id, houses ( id, name, color )",
    )
    .eq("id", user?.id ?? "")
    .maybeSingle<Profile>();

  const { data: subjectsRaw } = await supabase
    .from("student_subjects")
    .select("subject:subjects(name, code), is_sba")
    .eq("student_id", user?.id ?? "");
  const subjects = (subjectsRaw ?? []).map((r) => {
    const row = r as unknown as {
      subject: { name: string; code: string }[] | { name: string; code: string } | null;
      is_sba: boolean;
    };
    const subject = Array.isArray(row.subject) ? row.subject[0] ?? null : row.subject;
    return { subject, is_sba: row.is_sba };
  });

  const { data: sba } = await supabase
    .from("sba_projects")
    .select("id, title, subject, due_date, status, percent_complete")
    .eq("student_id", user?.id ?? "")
    .order("due_date", { ascending: true })
    .limit(4);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, subject, kind, url")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        {user?.is_anonymous && <GuestUpgradeBanner />}
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome
          {profile?.display_name
            ? `, ${profile.display_name}`
            : user?.is_anonymous
              ? ", guest"
              : ""}
          .
        </h1>
        <p className="mt-2 text-stone-600">Your day at a glance.</p>

        <QuickLinks />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <CalabarStudentCard profile={profile} email={user?.email ?? null} subjects={subjects} />

          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-calabar-green-800">House announcements</h2>
            <ul className="mt-4 divide-y divide-stone-200">
              {(announcements ?? []).length === 0 && (
                <li className="py-3 text-sm text-stone-500">Nothing posted yet.</li>
              )}
              {(announcements ?? []).map((a) => (
                <li key={a.id as string} className="py-3">
                  <p className="text-sm font-semibold">{a.title as string}</p>
                  <p className="text-sm text-stone-600">{a.body as string}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <SbaProgressCard projects={sba ?? []} />

          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-calabar-green-800">Resources for you</h2>
              <a href="/resources" className="text-sm font-medium text-calabar-green-700 hover:underline">
                Browse all →
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(resources ?? []).length === 0 && (
                <p className="text-sm text-stone-500">No resources uploaded yet.</p>
              )}
              {(resources ?? []).map((r) => (
                <ResourceCard
                  key={r.id as string}
                  title={r.title as string}
                  subject={r.subject as string}
                  kind={r.kind as string}
                  url={r.url as string}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickLinks() {
  const items = [
    { href: "/tools", label: "Lion Tools", desc: "Docs, Sheets, Slides, Notes" },
    { href: "/tools/sba", label: "SBA Workspace", desc: "Run your School-Based Assessment" },
    { href: "/groups", label: "Groups", desc: "Class, sports, clubs, houses" },
    { href: "/resources", label: "Resources", desc: "Past papers and notes" },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <a
          key={it.href}
          href={it.href}
          className="card transition hover:border-calabar-green-300 hover:shadow-md"
        >
          <p className="font-semibold text-calabar-green-800">{it.label}</p>
          <p className="mt-1 text-xs text-stone-600">{it.desc}</p>
        </a>
      ))}
    </div>
  );
}
