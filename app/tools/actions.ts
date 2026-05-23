"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SBA_SUBJECTS_BY_CODE } from "@/lib/sba-subjects";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Self-heal profile (for accounts created before trigger)
  await supabase.from("profiles").upsert(
    { id: user.id, full_name: (user.user_metadata?.full_name as string) ?? user.email ?? "Lion", role: (user.user_metadata?.role as string) ?? "student" },
    { onConflict: "id", ignoreDuplicates: true }
  );
  return { supabase, user };
}

export async function createDocument(kind: "doc" | "note") {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("documents")
    .insert({ owner_id: user.id, kind, title: kind === "note" ? "New note" : "Untitled" })
    .select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath(kind === "note" ? "/tools/notes" : "/tools/docs");
  redirect(`/tools/${kind === "note" ? "notes" : "docs"}/${data.id}`);
}

export async function deleteDocument(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/tools/notes");
  revalidatePath("/tools/docs");
}

export async function createSpreadsheet() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("spreadsheets")
    .insert({ owner_id: user.id }).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/tools/sheets");
  redirect(`/tools/sheets/${data.id}`);
}

export async function deleteSpreadsheet(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("spreadsheets").delete().eq("id", id);
  revalidatePath("/tools/sheets");
}

export async function createSlideDeck() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("slide_decks")
    .insert({ owner_id: user.id }).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/tools/slides");
  redirect(`/tools/slides/${data.id}`);
}

export async function deleteSlideDeck(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("slide_decks").delete().eq("id", id);
  revalidatePath("/tools/slides");
}

export async function createSbaProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim() || "New SBA Project";
  const subjectCode = String(formData.get("subject_code") ?? "").trim();
  const meta = SBA_SUBJECTS_BY_CODE[subjectCode];
  const subject = meta?.name ?? "General";

  const [{ data: doc }, { data: sheet }, { data: deck }] = await Promise.all([
    supabase.from("documents").insert({ owner_id: user.id, kind: "doc", title: `${title} — Essay`, subject, body: meta?.template ?? "" }).select("id").single(),
    supabase.from("spreadsheets").insert({ owner_id: user.id, title: `${title} — Data Sheet` }).select("id").single(),
    supabase.from("slide_decks").insert({ owner_id: user.id, title: `${title} — Slides`, slides: [{ title, body: meta?.sbaType ?? "" }, { title: "Introduction", body: "" }, { title: "Methodology", body: "" }, { title: "Findings", body: "" }, { title: "Conclusion", body: "" }] }).select("id").single(),
  ]);

  const { data: sba, error } = await supabase.from("sba_projects").insert({
    student_id: user.id,
    title,
    document_id: doc?.id ?? null,
    spreadsheet_id: sheet?.id ?? null,
    slide_deck_id: deck?.id ?? null,
  }).select("id").single();

  if (error) {
    // sba_projects may not have these columns yet — just redirect to tools
    revalidatePath("/tools/sba");
    redirect("/tools/sba");
  }
  revalidatePath("/tools/sba");
  redirect(`/tools/sba/${sba.id}`);
}
