import type { House } from "@/types";
import Link from "next/link";

const houseColors: Record<string, string> = {
  "Manning": "from-blue-900 to-zinc-900 border-blue-800",
  "Dacosta": "from-red-900 to-zinc-900 border-red-800",
  "Lowe": "from-yellow-900 to-zinc-900 border-yellow-800",
  "Ashenheim": "from-green-900 to-zinc-900 border-green-800",
};

const houseEmojis: Record<string, string> = {
  "Manning": "🔵",
  "Dacosta": "🔴",
  "Lowe": "🟡",
  "Ashenheim": "🟢",
};

export default function HouseCard({ house }: { house: House }) {
  const colorClass = houseColors[house.name] || "from-zinc-800 to-zinc-900 border-zinc-700";
  const emoji = houseEmojis[house.name] || "🏠";

  return (
    <Link href={`/houses/${house.id}`} className={`block overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClass} p-5 hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="font-black text-lg">{house.name} House</h3>
          <p className="text-xs text-zinc-400">{house.member_count} members</p>
        </div>
      </div>
      {house.motto && <p className="text-sm italic text-zinc-300 border-t border-white/10 pt-3">&quot;{house.motto}&quot;</p>}
    </Link>
  );
}
