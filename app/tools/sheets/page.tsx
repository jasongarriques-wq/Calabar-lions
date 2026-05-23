export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { Profile } from "@/types";
import { createSpreadsheet, deleteSpreadsheet } from "../actions";

export default async function SheetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/signup");

  const { data: sheets } = await supabase
    .from("spreadsheets")
    .select("id, title, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/tools" className="text-xs text-zinc-500 hover:text-zinc-300">← Lion Tools</Link>
            <h1 className="mt-1 text-2xl font-black">📊 Lion Sheets</h1>
            <p className="text-sm text-zinc-400">{sheets?.length ?? 0} sheet{sheets?.length !== 1 ? "s" : ""}</p>
          </div>
          <form action={createSpreadsheet}>
            <button type="submit" className="btn-primary">+ New Sheet</button>
          </form>
        </div>

        {sheets && sheets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((sheet) => (
              <div key={sheet.id} className="card group flex flex-col gap-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">📊</span>
                  <form action={deleteSpreadsheet.bind(null, sheet.id)}>
                    <button type="submit" className="text-xs text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                  </form>
                </div>
                <div>
                  <Link href={`/tools/sheets/${sheet.id}`} className="font-black text-white hover:text-green-400 transition-colors line-clamp-1">
                    {sheet.title}
                  </Link>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    Updated {new Date(sheet.updated_at).toLocaleDateString("en-JM", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <Link href={`/tools/sheets/${sheet.id}`} className="btn-secondary mt-auto text-center text-xs">
                  Open
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 py-16 text-center">
            <span className="text-5xl">📊</span>
            <h3 className="mt-4 text-lg font-black">No sheets yet</h3>
            <p className="mt-1 text-sm text-zinc-500">Create a spreadsheet for your data.</p>
            <form action={createSpreadsheet} className="mt-4">
              <button type="submit" className="btn-primary">+ New Sheet</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
