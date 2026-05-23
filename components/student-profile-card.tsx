import type { Profile } from "@/types";
import Link from "next/link";

export default function StudentProfileCard({ profile }: { profile: Profile }) {
  const roleColors: Record<string, string> = {
    student: "bg-green-950 text-green-300",
    teacher: "bg-blue-950 text-blue-300",
    alumni: "bg-yellow-950 text-yellow-300",
    parent: "bg-purple-950 text-purple-300",
    school_admin: "bg-red-950 text-red-300",
    group_admin: "bg-orange-950 text-orange-300",
  };

  const displayName = profile.full_name ?? profile.display_name ?? "Lion";

  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-zinc-900 text-2xl font-black">
        {displayName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${profile.id}`} className="font-black hover:text-green-400 transition-colors truncate">
            {displayName}
          </Link>
          {profile.approved && <span title="Verified">✅</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${roleColors[String(profile.role)] || "bg-zinc-800 text-zinc-300"}`}>
            {String(profile.role).replace("_", " ")}
          </span>
          {profile.form && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Form {profile.form}</span>
          )}
        </div>
      </div>
    </div>
  );
}
