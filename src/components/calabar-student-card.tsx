type Profile = {
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
  houses?: { name: string; color: string | null } | null;
};

type Subject = { subject: { name: string; code: string } | null; is_sba: boolean };

export function CalabarStudentCard({
  profile,
  email,
  subjects,
}: {
  profile: Profile | null;
  email: string | null;
  subjects: Subject[];
}) {
  const houseColor = profile?.houses?.color ?? "#137c3d";
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-white"
          style={{ background: houseColor }}
        >
          {(profile?.display_name ?? profile?.full_name ?? "C")
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">
            {profile?.display_name ?? profile?.full_name ?? "Calabar student"}
          </p>
          <p className="truncate text-xs text-stone-500">{email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile?.houses && (
              <span className="pill text-white" style={{ background: houseColor }}>
                {profile.houses.name}
              </span>
            )}
            {profile?.class_group && (
              <span className="pill bg-stone-100 text-stone-700">{profile.class_group}</span>
            )}
            {profile?.track && (
              <span className="pill bg-calabar-gold-100 text-calabar-gold-800">
                {profile.track.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-1 text-sm">
        <Row label="Grade" value={profile?.grade ? String(profile.grade) : "—"} />
        <Row label="Form" value={profile?.form ?? "—"} />
        <Row label="Class" value={profile?.class_group ?? "—"} />
        <Row label="House" value={profile?.houses?.name ?? "—"} />
        <Row label="Sport" value={profile?.sport ?? "—"} />
        <Row label="Club" value={profile?.club ?? "—"} />
        <Row label="Role" value={(profile?.role ?? "student").replace("_", " ")} />
        <Row
          label="Graduating year"
          value={profile?.graduating_year ? String(profile.graduating_year) : "—"}
        />
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Subjects
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {subjects.length === 0 && (
            <span className="text-sm text-stone-500">Add your subjects in Settings.</span>
          )}
          {subjects.map((s, i) => (
            <span
              key={i}
              className={`pill ${s.is_sba ? "bg-calabar-gold-100 text-calabar-gold-800" : "bg-calabar-green-50 text-calabar-green-800"}`}
            >
              {s.subject?.code ?? s.subject?.name}
              {s.is_sba ? " · SBA" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
