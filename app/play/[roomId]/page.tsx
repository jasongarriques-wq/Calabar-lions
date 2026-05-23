export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GameClient from "./game-client";

export default async function GameRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: room }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("game_rooms").select("*").eq("id", roomId).single(),
  ]);

  if (!room) redirect("/play");
  if (!profile) redirect("/login");

  return <GameClient room={room} currentProfile={profile} />;
}
