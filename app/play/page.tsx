export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, GameRoom, GameMode } from "@/types";

const MODE_LABELS: Record<GameMode, { label: string; color: string }> = {
  draw: { label: "DRAW", color: "bg-blue-900/60 text-blue-300 border-blue-700/40" },
  teams: { label: "TEAMS 2v2", color: "bg-purple-900/60 text-purple-300 border-purple-700/40" },
  french: { label: "FRENCH", color: "bg-orange-900/60 text-orange-300 border-orange-700/40" },
  "nine-nine": { label: "9-9", color: "bg-red-900/60 text-red-300 border-red-700/40" },
};

const LEADERBOARD = [
  { name: "King Leo", pts: 4820 },
  { name: "Roar Master", pts: 4210 },
  { name: "Pride Chief", pts: 3990 },
  { name: "Lion Heart", pts: 3540 },
  { name: "Den Leader", pts: 2980 },
];

export default async function PlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: rooms }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("game_rooms")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  if (!profile) redirect("/signup");

  const gameRooms = (rooms ?? []) as GameRoom[];
  const openRooms = gameRooms.filter((r) => r.status !== "finished");

  function playerCountColor(room: GameRoom) {
    if (room.current_players >= room.max_players) return "text-amber-400";
    return "text-emerald-400";
  }

  function statusDot(status: GameRoom["status"]) {
    if (status === "playing") return "bg-amber-400";
    if (status === "finished") return "bg-zinc-600";
    return "bg-emerald-400";
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0a0a", color: "white" }}
    >
      {/* ── LEFT SIDEBAR ───────────────────────────────────── */}
      <aside
        className="hidden md:flex w-72 shrink-0 flex-col overflow-y-auto border-r"
        style={{ background: "#111111", borderColor: "#222222" }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "#222222" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🦁</span>
            <div>
              <p className="font-black text-base tracking-tight text-white">CALABAR LIONS</p>
              <p
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#10b981" }}
              >
                DOMINO PLAY
              </p>
            </div>
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest"
            style={{ color: "#52525b" }}
          >
            Active Tables
          </p>
          <div className="space-y-0.5">
            {openRooms.map((room) => (
              <Link
                key={room.id}
                href={`/play/${room.id}`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all group"
                style={{ borderLeft: "3px solid transparent" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${statusDot(room.status)}`}
                  />
                  <span className="truncate text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                    {room.name}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold shrink-0 ml-2 ${playerCountColor(room)}`}
                >
                  {room.current_players}/{room.max_players}
                </span>
              </Link>
            ))}
            {openRooms.length === 0 && (
              <p className="px-2 py-4 text-xs text-zinc-600">No active tables</p>
            )}
          </div>
        </div>

        {/* Ranked Season */}
        <div className="px-4 pb-3">
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: "linear-gradient(135deg, #0f1f13, #111111)",
              borderColor: "#1a4a2a",
            }}
          >
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-1"
              style={{ color: "#52525b" }}
            >
              Ranked Season
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">👑</span>
              <p className="font-black text-sm text-white">CHAMPION I</p>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden mb-1"
              style={{ background: "#222222" }}
            >
              <div
                className="h-2 rounded-full"
                style={{
                  width: "72%",
                  background: "linear-gradient(90deg, #059669, #10b981)",
                  boxShadow: "0 0 8px #10b98166",
                }}
              />
            </div>
            <p className="text-[10px]" style={{ color: "#71717a" }}>1,850 / 2,000 pts</p>
          </div>

          {/* Nav items */}
          <div className="mt-3 space-y-1">
            <button
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-zinc-400 hover:text-white"
              style={{ background: "transparent" }}
            >
              <span>🏆</span> Leaderboard
            </button>
            <button
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-zinc-400 hover:text-white"
              style={{ background: "transparent" }}
            >
              <span>🛒</span> Store
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#222222", background: "#0a0a0a" }}
        >
          <div>
            <h1 className="text-2xl font-black text-white">Available Tables</h1>
            <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>
              {gameRooms.length} rooms · Join a table or create your own
            </p>
          </div>
          <Link
            href="/play/create"
            className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #d97706, #f59e0b)",
              boxShadow: "0 0 20px rgba(217,119,6,0.4), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span className="text-base">✦</span> CREATE TABLE
          </Link>
        </header>

        {/* Rooms grid + leaderboard */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {gameRooms.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-3xl border text-center"
              style={{ borderColor: "#222222", background: "#111111" }}
            >
              <span className="text-7xl mb-4">🎲</span>
              <p className="text-xl font-black text-white mb-2">No Tables Yet</p>
              <p className="text-sm text-zinc-500 mb-6">
                Be the first to set up a domino table
              </p>
              <Link
                href="/play/create"
                className="rounded-2xl px-6 py-3 text-sm font-black text-white"
                style={{
                  background: "linear-gradient(135deg, #d97706, #f59e0b)",
                  boxShadow: "0 0 20px rgba(217,119,6,0.3)",
                }}
              >
                ✦ Create First Table
              </Link>
            </div>
          ) : (
            <>
              {/* Rooms Grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
                {gameRooms.map((room) => {
                  const mode = room.game_mode ?? "draw";
                  const modeInfo = MODE_LABELS[mode as GameMode] ?? MODE_LABELS.draw;
                  const isFull = room.current_players >= room.max_players;
                  return (
                    <div
                      key={room.id}
                      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all group hover:scale-[1.01] cursor-pointer"
                      style={{
                        background: "#1a1a1a",
                        borderColor: "#222222",
                      }}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-black text-base text-white truncate group-hover:text-emerald-400 transition-colors">
                            {room.name}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>
                            Host: {room.host_name ?? "Anonymous"} · {room.points_to_win} pts target
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {/* Status */}
                          <span
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
                            style={{
                              background:
                                room.status === "playing"
                                  ? "rgba(217,119,6,0.15)"
                                  : room.status === "finished"
                                  ? "rgba(39,39,42,0.8)"
                                  : "rgba(16,185,129,0.12)",
                              color:
                                room.status === "playing"
                                  ? "#f59e0b"
                                  : room.status === "finished"
                                  ? "#52525b"
                                  : "#10b981",
                            }}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusDot(room.status)}`}
                            />
                            {room.status === "playing"
                              ? "In Progress"
                              : room.status === "finished"
                              ? "Finished"
                              : "Open"}
                          </span>
                          {/* Privacy */}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
                              room.is_private
                                ? "bg-amber-900/20 text-amber-400 border-amber-700/40"
                                : "bg-emerald-900/20 text-emerald-400 border-emerald-700/40"
                            }`}
                          >
                            {room.is_private ? "🔒 PRIVATE" : "🌐 PUBLIC"}
                          </span>
                        </div>
                      </div>

                      {/* Mode badge + player avatars */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${modeInfo.color}`}
                        >
                          {modeInfo.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {Array.from({ length: room.max_players }).map((_, i) => (
                              <div
                                key={i}
                                className="h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-black"
                                style={{
                                  borderColor: "#1a1a1a",
                                  background:
                                    i < room.current_players
                                      ? "linear-gradient(135deg, #059669, #1a3a2a)"
                                      : "#222222",
                                  color: i < room.current_players ? "white" : "#52525b",
                                }}
                              >
                                {i < room.current_players ? "👤" : "·"}
                              </div>
                            ))}
                          </div>
                          <span
                            className={`text-xs font-bold ${playerCountColor(room)}`}
                          >
                            {room.current_players}/{room.max_players}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <Link
                        href={`/play/${room.id}`}
                        className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
                        style={{
                          background: isFull
                            ? "rgba(217,119,6,0.1)"
                            : "rgba(16,185,129,0.1)",
                          border: `1px solid ${isFull ? "rgba(217,119,6,0.3)" : "rgba(16,185,129,0.3)"}`,
                          color: isFull ? "#f59e0b" : "#10b981",
                        }}
                      >
                        <span>
                          {room.status === "waiting" && !isFull
                            ? "Join Table"
                            : room.status === "playing"
                            ? "Watch Game"
                            : isFull
                            ? "Table Full"
                            : "Enter Room"}
                        </span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Leaderboard section */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: "#111111", borderColor: "#222222" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h2 className="font-black text-base text-white">LEADERBOARD</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#52525b" }}>
                      Top Domino Players This Season
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {LEADERBOARD.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        background: i === 0 ? "rgba(217,119,6,0.1)" : "#1a1a1a",
                        border: `1px solid ${i === 0 ? "rgba(217,119,6,0.3)" : "#222222"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base w-6 text-center">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                        </span>
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black"
                          style={{
                            background:
                              i === 0
                                ? "linear-gradient(135deg, #d97706, #92400e)"
                                : "linear-gradient(135deg, #059669, #1a3a2a)",
                          }}
                        >
                          {entry.name[0]}
                        </div>
                        <span className="font-bold text-sm text-white">{entry.name}</span>
                      </div>
                      <span
                        className="font-black text-sm"
                        style={{ color: i === 0 ? "#f59e0b" : "#10b981" }}
                      >
                        {entry.pts.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
