import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ToolComments } from "@/components/tool-comments";
import { createClient } from "@/lib/supabase/server";
import { SheetEditor } from "./sheet-editor";

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: me }] = await Promise.all([
    supabase
      .from("spreadsheets")
      .select("id, title, cells, rows, cols")
      .eq("id", id)
      .maybeSingle<{
        id: string;
        title: string;
        cells: Record<string, string>;
        rows: number;
        cols: number;
      }>(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle<{ role: string | null }>(),
  ]);

  if (!data) notFound();
  const isStaff = me?.role === "admin" || me?.role === "teacher";

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-6">
        <Link href="/tools/sheets" className="text-sm text-calabar-green-700 hover:underline">
          ← All sheets
        </Link>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_22rem]">
          <SheetEditor
            id={data.id}
            initialTitle={data.title}
            initialCells={data.cells ?? {}}
            rows={data.rows ?? 20}
            cols={data.cols ?? 10}
          />
          <ToolComments
            targetKind="sheet"
            targetId={data.id}
            currentUserId={user?.id ?? null}
            isStaff={isStaff}
          />
        </div>
      </section>
    </main>
  );
}
