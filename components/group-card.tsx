import type { Group } from "@/types";
import Link from "next/link";

const typeIcons: Record<string, string> = {
  subject: "📚", school: "🏫", sba: "📊", club: "🎭", house: "🏠", general: "💬",
};

const typeColors: Record<string, string> = {
  subject: "bg-blue-950 text-blue-300",
  school: "bg-green-950 text-green-300",
  sba: "bg-yellow-950 text-yellow-300",
  club: "bg-purple-950 text-purple-300",
  house: "bg-orange-950 text-orange-300",
  general: "bg-zinc-800 text-zinc-300",
};

export default function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.id}`} className="card hover:border-zinc-700 transition-colors block">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
          {typeIcons[group.type] || "💬"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black truncate">{group.name}</h3>
          {group.description && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{group.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${typeColors[group.type]}`}>
              {group.type}
            </span>
            <span className="text-xs text-zinc-500">👥 {group.member_count.toLocaleString()} members</span>
            {group.is_private && <span className="text-xs text-zinc-500">🔒 Private</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
