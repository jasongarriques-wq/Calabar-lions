import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DocEditor,
  type DocCitation,
  type DocVersion,
  type Spreadsheet,
  type SlideDeck,
  type DocAuthorMeta,
} from "./doc-editor";

type Doc = {
  id: string;
  title: string;
  body: string;
  kind: string;
  owner_id: string;
  subject: string | null;
  citations: DocCitation[] | null;
  status: "draft" | "submitted" | "reviewed" | null;
  linked_spreadsheet_id: string | null;
  linked_slide_deck_id: string | null;
};

type OwnerProfile = {
  display_name: string | null;
  full_name: string | null;
  form: string | null;
  class_group: string | null;
  academic_year: string | null;
  graduating_year: number | null;
};

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Doc | null = null;
  let me: { role: string | null } | null = null;
  let sheets: Spreadsheet[] = [];
  let decks: SlideDeck[] = [];
  let versions: DocVersion[] = [];
  let owner: OwnerProfile | null = null;
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const [docRes, meRes] = await Promise.all([
      supabase
        .from("documents")
        .select(
          "id, title, body, kind, owner_id, subject, citations, status, linked_spreadsheet_id, linked_slide_deck_id",
        )
        .eq("id", id)
        .eq("kind", "doc")
        .maybeSingle<Doc>(),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .maybeSingle<{ role: string | null }>(),
    ]);
    if (docRes.error) console.error("[doc detail] doc", docRes.error);
    if (meRes.error) console.error("[doc detail] me", meRes.error);
    data = docRes.data ?? null;
    me = meRes.data ?? null;

    if (data) {
      const [sheetsRes, decksRes, versionsRes, ownerRes] = await Promise.all([
        supabase
          .from("spreadsheets")
          .select("id, title")
          .eq("owner_id", data.owner_id)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("slide_decks")
          .select("id, title")
          .eq("owner_id", data.owner_id)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("document_versions")
          .select("id, title, body, note, created_at")
          .eq("document_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("profiles")
          .select(
            "display_name, full_name, form, class_group, academic_year, graduating_year",
          )
          .eq("id", data.owner_id)
          .maybeSingle<OwnerProfile>(),
      ]);
      if (sheetsRes.error) console.error("[doc detail] sheets", sheetsRes.error);
      if (decksRes.error) console.error("[doc detail] decks", decksRes.error);
      if (versionsRes.error) console.error("[doc detail] versions", versionsRes.error);
      if (ownerRes.error) console.error("[doc detail] owner", ownerRes.error);
      sheets = (sheetsRes.data as Spreadsheet[] | null) ?? [];
      decks = (decksRes.data as SlideDeck[] | null) ?? [];
      versions = (versionsRes.data as DocVersion[] | null) ?? [];
      owner = ownerRes.data ?? null;
    }
  } catch (e) {
    console.error("[doc detail] fatal", e);
  }

  if (!data) notFound();

  const isStaff = me?.role === "admin" || me?.role === "teacher";
  const isOwner = data.owner_id === userId;
  const canEdit = isOwner || isStaff;

  const author: DocAuthorMeta = {
    name: owner?.display_name ?? owner?.full_name ?? "Calabar Lion",
    form: owner?.form ?? null,
    classGroup: owner?.class_group ?? null,
    subject: data.subject ?? null,
    academicYear: owner?.academic_year ?? null,
    graduatingYear: owner?.graduating_year ?? null,
  };

  return (
    <DocEditor
      id={data.id}
      initialTitle={data.title}
      initialBody={data.body}
      initialCitations={(data.citations ?? []) as DocCitation[]}
      initialStatus={(data.status ?? "draft") as "draft" | "submitted" | "reviewed"}
      initialSubject={data.subject ?? ""}
      linkedSpreadsheetId={data.linked_spreadsheet_id}
      linkedSlideDeckId={data.linked_slide_deck_id}
      spreadsheets={sheets}
      slideDecks={decks}
      initialVersions={versions}
      author={author}
      canEdit={canEdit}
    />
  );
}
