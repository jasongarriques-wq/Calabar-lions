import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoteEditor } from "./note-editor";

type Note = {
  id: string;
  title: string;
  body: string;
  subject: string | null;
};

type OwnerProfile = {
  display_name: string | null;
  full_name: string | null;
  form: string | null;
  class_group: string | null;
};

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Note | null = null;
  let owner: OwnerProfile | null = null;
  let canEdit = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [docRes, profileRes] = await Promise.all([
      supabase
        .from("documents")
        .select("id, title, body, subject, kind, owner_id")
        .eq("id", id)
        .eq("kind", "note")
        .maybeSingle<Note & { kind: string; owner_id: string }>(),
      supabase
        .from("profiles")
        .select("display_name, full_name, form, class_group")
        .eq("id", user?.id ?? "")
        .maybeSingle<OwnerProfile>(),
    ]);
    if (docRes.error) console.error("[note detail] doc", docRes.error);
    if (profileRes.error) console.error("[note detail] profile", profileRes.error);
    data = docRes.data ?? null;
    owner = profileRes.data ?? null;
    canEdit = !!user && docRes.data?.owner_id === user.id;
  } catch (e) {
    console.error("[note detail] fatal", e);
  }

  if (!data) notFound();

  return (
    <NoteEditor
      id={data.id}
      initialTitle={data.title}
      initialBody={data.body}
      initialSubject={data.subject ?? ""}
      author={{
        name: owner?.display_name ?? owner?.full_name ?? "Calabar Lion",
        form: owner?.form ?? null,
        classGroup: owner?.class_group ?? null,
      }}
      canEdit={canEdit}
    />
  );
}
