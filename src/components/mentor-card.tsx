type Mentor = {
  id: string;
  full_name: string;
  graduation_year: number | null;
  industry: string | null;
  bio: string | null;
  avatar_url: string | null;
  capacity: number | null;
  taken: number | null;
};

export function MentorCard({ mentor }: { mentor: Mentor }) {
  const available = (mentor.capacity ?? 0) - (mentor.taken ?? 0);
  return (
    <div className="card flex flex-col">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-calabar-green-700 text-white">
          {mentor.full_name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{mentor.full_name}</p>
          <p className="text-xs text-stone-500">
            Class of {mentor.graduation_year ?? "—"}
            {mentor.industry ? ` · ${mentor.industry}` : ""}
          </p>
        </div>
      </div>
      {mentor.bio && (
        <p className="mt-3 line-clamp-3 text-sm text-stone-600">{mentor.bio}</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`pill ${
            available > 0 ? "bg-calabar-green-50 text-calabar-green-800" : "bg-stone-100 text-stone-500"
          }`}
        >
          {available > 0 ? `${available} slot${available === 1 ? "" : "s"} open` : "Full"}
        </span>
        <button className="btn-secondary" disabled={available <= 0}>
          Request mentor
        </button>
      </div>
    </div>
  );
}
