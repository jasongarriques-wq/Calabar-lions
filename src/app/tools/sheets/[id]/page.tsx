import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { SheetEditor } from "./sheet-editor";

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("spreadsheets")
    .select("id, title, cells, rows, cols")
    .eq("id", id)
    .maybeSingle<{ id: string; title: string; cells: Record<string, string>; rows: number; cols: number }>();
  if (!data) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-6">
        <Link href="/tools/sheets" className="text-sm text-calabar-green-700 hover:underline">
          ← All sheets
        </Link>
        <SheetEditor
          id={data.id}
          initialTitle={data.title}
          initialCells={data.cells ?? {}}
          rows={data.rows ?? 20}
          cols={data.cols ?? 10}
        />
      </section>
    </main>
  );
}
