import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ToolComments } from "@/components/tool-comments";
import { PresenceBar } from "@/components/presence-bar";
import { createClient } from "@/lib/supabase/server";
import {
  DocEditor,
  type DocCitation,
  type DocVersion,
  type Spreadsheet,
  type SlideDeck,
} from "./doc-editor";

type Doc = {
  id: string;
  title: string;
  body: string;
  kind: string;
  owner_id: string;
  citations: DocCitation[] | null;
  status: "draft" | "submitted" | "reviewed" | null;
  linked_spreadsheet_id: string | null;
  linked_slide_deck_id: string | null;
};

export default async function DocDetailPage({
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
      .from("documents")
      .select(
        "id, title, body, kind, owner_id, citations, status, linked_spreadsheet_id, linked_slide_deck_id",
      )
      .eq("id", id)
      .eq("kind", "doc")
      .maybeSingle<Doc>(),
    supabase
      .from("profiles")
      .select("display_name, full_name, role")
      .eq("id", user?.id ?? "")
      .maybeSingle<{
        display_name: string | null;
        full_name: string | null;
        role: string | null;
      }>(),
  ]);

  if (!data) notFound();
  const isStaff = me?.role === "admin" || me?.role === "teacher";
  const isOwner = data.owner_id === user?.id;
  const canEdit = isOwner || isStaff;

  const [{ data: sheets }, { data: decks }, { data: versions }] = await Promise.all([
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
  ]);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href="/tools/docs" className="text-sm text-calabar-green-700 hover:underline">
            ← All documents
          </Link>
          <PresenceBar
            topic={`doc:${data.id}`}
            currentUserId={user?.id ?? null}
            currentUserName={me?.display_name ?? me?.full_name ?? "Lion"}
            currentUserRole={me?.role ?? "student"}
          />
        </div>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_22rem]">
          <DocEditor
            id={data.id}
            initialTitle={data.title}
            initialBody={data.body}
            initialCitations={(data.citations ?? []) as DocCitation[]}
            initialStatus={(data.status ?? "draft") as "draft" | "submitted" | "reviewed"}
            linkedSpreadsheetId={data.linked_spreadsheet_id}
            linkedSlideDeckId={data.linked_slide_deck_id}
            spreadsheets={(sheets as Spreadsheet[] | null) ?? []}
            slideDecks={(decks as SlideDeck[] | null) ?? []}
            initialVersions={(versions as DocVersion[] | null) ?? []}
            canEdit={canEdit}
          />
          <div className="print:hidden">
            <ToolComments
              targetKind="doc"
              targetId={data.id}
              currentUserId={user?.id ?? null}
              isStaff={isStaff}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
