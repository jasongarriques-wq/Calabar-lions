import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SlideEditor, type Slide } from "./slide-editor";

type Deck = {
  id: string;
  title: string;
  slides: Slide[];
};

type OwnerProfile = {
  display_name: string | null;
  full_name: string | null;
  form: string | null;
  class_group: string | null;
};

export default async function SlideDeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Deck | null = null;
  let owner: OwnerProfile | null = null;
  let canEdit = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [docRes, profileRes] = await Promise.all([
      supabase
        .from("slide_decks")
        .select("id, title, slides, owner_id")
        .eq("id", id)
        .maybeSingle<Deck & { owner_id: string }>(),
      supabase
        .from("profiles")
        .select("display_name, full_name, form, class_group")
        .eq("id", user?.id ?? "")
        .maybeSingle<OwnerProfile>(),
    ]);
    if (docRes.error) console.error("[slide detail] doc", docRes.error);
    if (profileRes.error) console.error("[slide detail] profile", profileRes.error);
    data = docRes.data ?? null;
    owner = profileRes.data ?? null;
    canEdit = !!user && docRes.data?.owner_id === user.id;
  } catch (e) {
    console.error("[slide detail] fatal", e);
  }

  if (!data) notFound();

  return (
    <SlideEditor
      id={data.id}
      initialTitle={data.title}
      initialSlides={Array.isArray(data.slides) ? data.slides : []}
      author={{
        name: owner?.display_name ?? owner?.full_name ?? "Calabar Lion",
        form: owner?.form ?? null,
        classGroup: owner?.class_group ?? null,
      }}
      canEdit={canEdit}
    />
  );
}
