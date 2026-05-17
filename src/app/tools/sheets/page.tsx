import Link from "next/link";
import { Plus, Table2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createSpreadsheet, deleteSpreadsheet } from "../actions";

export const metadata = { title: "Lion Sheets" };

type SheetRow = {
  id: string;
  title: string;
  updated_at: string;
};

export default async function SheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("spreadsheets")
    .select("id, title, updated_at")
    .eq("owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(100);
  const sheets = (data as SheetRow[] | null) ?? [];

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Lion Sheets</h1>
            <p className="mt-1 text-stone-600">Quick calculations, gradebooks, and SBA data tables.</p>
          </div>
          <form action={createSpreadsheet}>
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              New sheet
            </button>
          </form>
        </div>

        {sheets.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <Table2 className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600">No spreadsheets yet.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s) => (
              <li key={s.id} className="card flex flex-col">
                <Link href={`/tools/sheets/${s.id}`} className="block">
                  <Table2 className="h-6 w-6 text-calabar-green-700" />
                  <p className="mt-3 font-semibold">{s.title || "Untitled"}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(s.updated_at).toLocaleString()}
                  </p>
                </Link>
                <form action={deleteSpreadsheet.bind(null, s.id)} className="mt-3 self-end">
                  <button type="submit" className="text-xs text-red-700 hover:underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
