import type { Mentor } from "@/types";
import Link from "next/link";

export default function MentorCard({ mentor }: { mentor: Mentor }) {
  const name = mentor.profiles?.full_name ?? mentor.profiles?.display_name ?? "Alumni";

  return (
    <div className="card flex gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-700 to-zinc-800 text-xl font-black">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${mentor.profile_id}`} className="font-black hover:text-green-400 transition-colors">
            {name}
          </Link>
          {mentor.verified && <span className="text-xs bg-green-950 text-green-400 border border-green-800 rounded-full px-2 py-0.5">✓ Verified</span>}
        </div>
        <p className="text-sm text-zinc-400 mt-0.5">
          {mentor.industry}{mentor.company ? ` · ${mentor.company}` : ""}
          {mentor.graduation_year ? ` · Class of ${mentor.graduation_year}` : ""}
        </p>
        {mentor.bio && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{mentor.bio}</p>}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-zinc-500">{mentor.capacity} spots open</span>
          <button className="rounded-lg bg-green-950 border border-green-800 px-3 py-1 text-xs font-semibold text-green-400 hover:bg-green-900 transition-colors">
            Request Mentorship
          </button>
        </div>
      </div>
    </div>
  );
}
