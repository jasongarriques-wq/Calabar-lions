"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createDocument(kind: "doc" | "note") {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("documents")
    .insert({ owner_id: user.id, kind, title: kind === "note" ? "New note" : "Untitled" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(kind === "note" ? "/tools/notes" : "/tools/docs");
  redirect(`/tools/${kind === "note" ? "notes" : "docs"}/${data.id}`);
}

export async function deleteDocument(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tools/notes");
  revalidatePath("/tools/docs");
}

export async function createSpreadsheet() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("spreadsheets")
    .insert({ owner_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/tools/sheets");
  redirect(`/tools/sheets/${data.id}`);
}

export async function deleteSpreadsheet(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("spreadsheets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tools/sheets");
}

export async function createSlideDeck() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("slide_decks")
    .insert({ owner_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/tools/slides");
  redirect(`/tools/slides/${data.id}`);
}

export async function deleteSlideDeck(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("slide_decks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tools/slides");
}

export async function createSbaProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim() || "New SBA Project";
  const subject = String(formData.get("subject") ?? "").trim() || "General";

  const [{ data: doc }, { data: sheet }, { data: deck }] = await Promise.all([
    supabase
      .from("documents")
      .insert({ owner_id: user.id, kind: "doc", title: `${title} — Essay`, subject })
      .select("id")
      .single(),
    supabase
      .from("spreadsheets")
      .insert({ owner_id: user.id, title: `${title} — Sheet` })
      .select("id")
      .single(),
    supabase
      .from("slide_decks")
      .insert({ owner_id: user.id, title: `${title} — Slides` })
      .select("id")
      .single(),
  ]);

  const { data: sba, error } = await supabase
    .from("sba_projects")
    .insert({
      student_id: user.id,
      subject,
      title,
      document_id: doc?.id ?? null,
      spreadsheet_id: sheet?.id ?? null,
      slide_deck_id: deck?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/tools/sba");
  redirect(`/tools/sba/${sba.id}`);
}
