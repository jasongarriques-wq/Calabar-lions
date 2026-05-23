import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Shield,
  Trophy,
  UserCheck,
  UserX,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  role: string | null;
  form: string | null;
  grade: number | null;
  class_group: string | null;
  academic_year: string | null;
  graduating_year: number | null;
  track: string | null;
  sport: string | null;
  club: string | null;
  bio: string | null;
  approved: boolean | null;
  created_at: string;
  houses?: { id: string; name: string; color: string | null } | null;
};

type Subject = { is_sba: boolean; subject: { name: string; code: string } | null };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let profile: Profile | null = null;
  let me: { role: string | null } | null = null;
  let subjects: Subject[] = [];
  let memberships: Array<{ id: string; name: string; type: string }> = [];
  let badges: Array<{ slug: string; name: string; icon: string | null }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [profileRes, meRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, display_name, full_name, role, form, grade, class_group, academic_year, graduating_year, track, sport, club, bio, approved, created_at, houses ( id, name, color )",
        )
        .eq("id", id)
        .maybeSingle<Profile>(),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .maybeSingle<{ role: string | null }>(),
    ]);
    if (profileRes.error) console.error("[profile] base", profileRes.error);
    profile = profileRes.data ?? null;
    me = meRes.data ?? null;

    if (profile) {
      const [subjectsRes, membershipsRes, badgesRes] = await Promise.all([
        supabase
          .from("student_subjects")
          .select("is_sba, subject:subjects(name, code)")
          .eq("student_id", profile.id),
        supabase
          .from("group_members")
          .select("group_id, group:groups(id, name, type)")
          .eq("user_id", profile.id)
          .limit(50),
        supabase
          .from("user_badges")
          .select("badge:badges(slug, name, icon)")
          .eq("user_id", profile.id),
      ]);
      type SubjectRow = {
        is_sba: boolean;
        subject:
          | { name: string; code: string }
          | { name: string; code: string }[]
          | null;
      };
      subjects = ((subjectsRes.data as SubjectRow[] | null) ?? []).map((r) => ({
        is_sba: r.is_sba,
        subject: Array.isArray(r.subject) ? r.subject[0] ?? null : r.subject,
      }));
      type GroupRow = {
        group:
          | { id: string; name: string; type: string }
          | { id: string; name: string; type: string }[]
          | null;
      };
      memberships = ((membershipsRes.data as GroupRow[] | null) ?? [])
        .map((r) => (Array.isArray(r.group) ? r.group[0] : r.group))
        .filter(Boolean) as Array<{ id: string; name: string; type: string }>;
      type BadgeRow = {
        badge:
          | { slug: string; name: string; icon: string | null }
          | { slug: string; name: string; icon: string | null }[]
          | null;
      };
      badges = ((badgesRes.data as BadgeRow[] | null) ?? [])
        .map((r) => (Array.isArray(r.badge) ? r.badge[0] : r.badge))
        .filter(Boolean) as Array<{ slug: string; name: string; icon: string | null }>;
    }
  } catch (e) {
    console.error("[profile] fatal", e);
  }

  if (!profile) notFound();

  const isAdmin =
    me?.role === "admin" ||
    me?.role === "super_admin" ||
    me?.role === "senior_admin";
  const houseColor = profile.houses?.color ?? "#137c3d";
  const initials = (profile.display_name ?? profile.full_name ?? "C")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main>
      <Navbar />
      <section className="bg-gradient-to-br from-calabar-green-900 via-calabar-green-800 to-calabar-ink text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-start gap-5">
            <div
              className="grid h-20 w-20 place-items-center rounded-2xl text-2xl font-black text-white"
              style={{ background: houseColor }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-calabar-gold-200">
                Read-only profile
              </span>
              <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
                {profile.display_name ?? profile.full_name ?? "Calabar Lion"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-200">
                {profile.class_group && <Chip>Class {profile.class_group}</Chip>}
                {profile.form && <Chip>Form {profile.form}</Chip>}
                {profile.houses && <Chip>{profile.houses.name}</Chip>}
                {profile.track && <Chip>{profile.track.toUpperCase()}</Chip>}
                <Chip>{(profile.role ?? "student").replace("_", " ")}</Chip>
                {profile.approved ? (
                  <span className="inline-flex items-center gap-1 text-xs text-calabar-green-300">
                    <UserCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-200">
                    <UserX className="h-3.5 w-3.5" /> Pending verification
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold text-calabar-green-800">
            <GraduationCap className="h-4 w-4" /> Academic
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Row label="Grade" value={profile.grade ? String(profile.grade) : "—"} />
            <Row label="Form" value={profile.form ?? "—"} />
            <Row label="Class" value={profile.class_group ?? "—"} />
            <Row label="House" value={profile.houses?.name ?? "—"} />
            <Row label="Track" value={profile.track ?? "—"} />
            <Row label="Sport" value={profile.sport ?? "—"} />
            <Row label="Club" value={profile.club ?? "—"} />
            <Row label="Academic year" value={profile.academic_year ?? "—"} />
            <Row
              label="Graduating"
              value={profile.graduating_year ? String(profile.graduating_year) : "—"}
            />
            <Row label="Joined" value={new Date(profile.created_at).toLocaleDateString()} />
          </dl>

          {profile.bio && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Bio
              </p>
              <p className="mt-1 text-sm text-stone-700">{profile.bio}</p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Subjects
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {subjects.length === 0 && (
                <span className="text-sm text-stone-500">No subjects on file.</span>
              )}
              {subjects.map((s, i) => (
                <span
                  key={i}
                  className={`pill ${
                    s.is_sba
                      ? "bg-calabar-gold-100 text-calabar-gold-800"
                      : "bg-calabar-green-50 text-calabar-green-800"
                  }`}
                >
                  {s.subject?.code ?? s.subject?.name}
                  {s.is_sba ? " · SBA" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold text-calabar-green-800">
              <Trophy className="h-4 w-4" /> Badges
            </h2>
            {badges.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">No badges yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.slug}
                    className="pill bg-calabar-gold-100 text-calabar-gold-800"
                  >
                    {b.icon ?? "🏅"} {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold text-calabar-green-800">
              <Mail className="h-4 w-4" /> Groups
            </h2>
            {memberships.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Not in any groups yet.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {memberships.slice(0, 20).map((g) => (
                  <li key={g.id} className="flex items-center justify-between">
                    <Link
                      href={`/groups/${g.id}`}
                      className="truncate hover:text-calabar-green-700 hover:underline"
                    >
                      {g.name}
                    </Link>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-stone-500">
                      {g.type}
                    </span>
                  </li>
                ))}
                {memberships.length > 20 && (
                  <li className="text-xs text-stone-500">
                    +{memberships.length - 20} more
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-5xl px-6 pb-8 text-xs text-stone-500">
        This profile is read-only. To edit your own details, go to Settings.
      </p>
    </main>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
    </div>
  );
}
