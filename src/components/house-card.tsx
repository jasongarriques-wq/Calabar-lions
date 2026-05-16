import Link from "next/link";

type House = {
  id: string;
  name: string;
  motto: string | null;
  color: string | null;
  member_count?: number;
};

export function HouseCard({ house }: { house: House }) {
  const color = house.color ?? "#137c3d";
  return (
    <Link
      href={`/houses/${house.id}`}
      className="block overflow-hidden rounded-2xl border border-stone-200 transition hover:shadow-md"
    >
      <div className="h-24" style={{ background: color }} />
      <div className="bg-white p-5">
        <h3 className="text-lg font-semibold">{house.name}</h3>
        {house.motto && <p className="mt-1 text-sm italic text-stone-600">“{house.motto}”</p>}
        <p className="mt-3 text-xs text-stone-500">
          {(house.member_count ?? 0).toLocaleString()} members
        </p>
      </div>
    </Link>
  );
}
