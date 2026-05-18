import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SheetEditor } from "./sheet-editor";

type Sheet = {
  id: string;
  title: string;
  cells: Record<string, string>;
  rows: number;
  cols: number;
};

type OwnerProfile = {
  display_name: string | null;
  full_name: string | null;
  form: string | null;
  class_group: string | null;
};

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Sheet | null = null;
  let owner: OwnerProfile | null = null;
  let canEdit = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [docRes, profileRes] = await Promise.all([
      supabase
        .from("spreadsheets")
        .select("id, title, cells, rows, cols, owner_id")
        .eq("id", id)
        .maybeSingle<Sheet & { owner_id: string }>(),
      supabase
        .from("profiles")
        .select("display_name, full_name, form, class_group")
        .eq("id", user?.id ?? "")
        .maybeSingle<OwnerProfile>(),
    ]);
    if (docRes.error) console.error("[sheet detail] doc", docRes.error);
    if (profileRes.error) console.error("[sheet detail] profile", profileRes.error);
    data = docRes.data ?? null;
    owner = profileRes.data ?? null;
    canEdit = !!user && docRes.data?.owner_id === user.id;
  } catch (e) {
    console.error("[sheet detail] fatal", e);
  }

  if (!data) notFound();

  return (
    <SheetEditor
      id={data.id}
      initialTitle={data.title}
      initialCells={data.cells ?? {}}
      rows={data.rows ?? 20}
      cols={data.cols ?? 10}
      author={{
        name: owner?.display_name ?? owner?.full_name ?? "Calabar Lion",
        form: owner?.form ?? null,
        classGroup: owner?.class_group ?? null,
      }}
      canEdit={canEdit}
    />
  );
}
