import type { SBAProject } from "@/types";
import Link from "next/link";

const statusColors: Record<string, string> = {
  not_started: "bg-zinc-800 text-zinc-400",
  in_progress: "bg-blue-950 text-blue-300",
  submitted: "bg-yellow-950 text-yellow-300",
  graded: "bg-green-950 text-green-300",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded ✓",
};

export default function SBAProgressCard({ sba }: { sba: SBAProject }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{sba.title}</h3>
          {sba.subjects && (
            <p className="text-xs text-zinc-500">{sba.subjects.name} · {sba.subjects.level}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[sba.status]}`}>
          {statusLabels[sba.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
          <span>Progress</span>
          <span className="font-bold text-white">{sba.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${sba.progress === 100 ? "bg-green-500" : "bg-green-600"}`}
            style={{ width: `${sba.progress}%` }}
          />
        </div>
      </div>

      {sba.due_date && (
        <p className="text-xs text-zinc-500">
          📅 Due: {new Date(sba.due_date).toLocaleDateString("en-JM", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}

      <Link href={`/sba/${sba.id}`} className="btn-secondary block text-center text-xs py-2">
        View Details
      </Link>
    </div>
  );
}
