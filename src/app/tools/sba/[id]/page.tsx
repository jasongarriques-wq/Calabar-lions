import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SbaProjectEditor } from "./sba-project-editor";
import { SbaFiles } from "./sba-files";
import { ToolComments } from "@/components/tool-comments";

type Project = {
  id: string;
  title: string;
  subject: string;
  status: string | null;
  percent_complete: number | null;
  due_date: string | null;
  notes: string | null;
  student_id: string;
  document_id: string | null;
  spreadsheet_id: string | null;
  slide_deck_id: string | null;
};

type OwnerProfile = {
  display_name: string | null;
  full_name: string | null;
  form: string | null;
  class_group: string | null;
};

export default async function SbaProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Project | null = null;
  let me: { role: string | null } | null = null;
  let owner: OwnerProfile | null = null;
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const [projectRes, meRes] = await Promise.all([
      supabase
        .from("sba_projects")
        .select(
          "id, title, subject, status, percent_complete, due_date, notes, student_id, document_id, spreadsheet_id, slide_deck_id",
        )
        .eq("id", id)
        .maybeSingle<Project>(),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .maybeSingle<{ role: string | null }>(),
    ]);
    if (projectRes.error) console.error("[sba detail] project", projectRes.error);
    if (meRes.error) console.error("[sba detail] me", meRes.error);
    data = projectRes.data ?? null;
    me = meRes.data ?? null;

    if (data) {
      const ownerRes = await supabase
        .from("profiles")
        .select("display_name, full_name, form, class_group")
        .eq("id", data.student_id)
        .maybeSingle<OwnerProfile>();
      owner = ownerRes.data ?? null;
    }
  } catch (e) {
    console.error("[sba detail] fatal", e);
  }

  if (!data) notFound();

  const isStaff = me?.role === "admin" || me?.role === "teacher";
  const isOwner = data.student_id === userId;
  const canEdit = isOwner || isStaff;

  return (
    <SbaProjectEditor
      project={data}
      canEdit={canEdit}
      author={{
        name: owner?.display_name ?? owner?.full_name ?? "Calabar Lion",
        form: owner?.form ?? null,
        classGroup: owner?.class_group ?? null,
      }}
      filesPanel={
        <SbaFiles sbaId={data.id} ownerId={data.student_id} canUpload={isOwner || isStaff} />
      }
      commentsPanel={
        <ToolComments
          targetKind="sba"
          targetId={data.id}
          currentUserId={userId}
          isStaff={isStaff}
        />
      }
    />
  );
}
