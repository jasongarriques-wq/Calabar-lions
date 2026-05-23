"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { GameMode } from "@/types";

const GAME_MODES: {
  id: GameMode;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
}[] = [
  {
    id: "draw",
    label: "Singles Draw",
    subtitle: "Classic domino rules. Draw from boneyard when you can't play.",
    icon: "🎲",
    color: "border-blue-600/50 bg-blue-950/20",
    glow: "#3b82f6",
  },
  {
    id: "teams",
    label: "Teams 2v2",
    subtitle: "Seats 0&2 vs 1&3. Team scores combined. Strategic partnerships.",
    icon: "⚔️",
    color: "border-purple-600/50 bg-purple-950/20",
    glow: "#a855f7",
  },
  {
    id: "french",
    label: "French Dominoes",
    subtitle: "Open pool — all tiles visible. Choose your tile strategically.",
    icon: "🗼",
    color: "border-orange-600/50 bg-orange-950/20",
    glow: "#f97316",
  },
  {
    id: "nine-nine",
    label: "9-9 Dominoes",
    subtitle: "Double-9 set with 55 tiles. More tiles, deeper strategy.",
    icon: "🔥",
    color: "border-red-600/50 bg-red-950/20",
    glow: "#ef4444",
  },
];

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const POINTS_PRESETS = [50, 100, 200];
const ROUND_PRESETS = [5, 10, 15, 20];

export default function CreateTablePage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("draw");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [pointsToWin, setPointsToWin] = useState(100);
  const [maxRounds, setMaxRounds] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0); // animate in steps

  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 100);
    return () => clearTimeout(timer);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter a room name."); return; }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    const maxP = (gameMode === "teams") ? 4 : maxPlayers;

    const { data: room, error: err } = await supabase
      .from("game_rooms")
      .insert({
        name: name.trim(),
        points_to_win: pointsToWin,
        max_rounds: maxRounds,
        max_players: maxP,
        created_by: profile?.id ?? null,
        game_mode: gameMode,
        is_private: isPrivate,
        invite_code: isPrivate ? inviteCode : null,
        host_name: profile?.full_name ?? "Anonymous",
        spectator_count: 0,
        status: "waiting",
        current_players: 0,
      })
      .select()
      .single();

    if (err) { setError(err.message); setLoading(false); return; }
    router.push(`/play/${(room as any).id}`);
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center py-10 px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="w-full max-w-2xl">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <Link
            href="/play"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-white transition-colors"
          >
            ← Back to Tables
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✦</span>
            <h1 className="text-3xl font-black text-white">CREATE TABLE</h1>
          </div>
          <p className="text-sm" style={{ color: "#71717a" }}>
            Set up a premium domino room for you and your lions
          </p>
        </motion.div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Room Name */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border p-5"
            style={{ background: "#111111", borderColor: "#222222" }}
          >
            <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>
              Room Name
            </label>
            <input
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-600 focus:outline-none transition-all"
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
              }}
              placeholder="e.g. Lions Den, Pride Table..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </motion.div>

          {/* Game Mode */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border p-5"
            style={{ background: "#111111", borderColor: "#222222" }}
          >
            <label className="block text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#52525b" }}>
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setGameMode(m.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    gameMode === m.id ? m.color : "border-zinc-800/50 bg-zinc-900/30"
                  }`}
                  style={
                    gameMode === m.id
                      ? { boxShadow: `0 0 16px ${m.glow}33` }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{m.icon}</span>
                    {gameMode === m.id && (
                      <span
                        className="ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: `${m.glow}33`, color: m.glow }}
                      >
                        SELECTED
                      </span>
                    )}
                  </div>
                  <p className="font-black text-sm text-white">{m.label}</p>
                  <p className="text-xs mt-1" style={{ color: "#71717a" }}>{m.subtitle}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Players + Points + Rounds */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border p-5"
            style={{ background: "#111111", borderColor: "#222222" }}
          >
            <label className="block text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#52525b" }}>
              Game Settings
            </label>

            {/* Max Players */}
            {gameMode !== "teams" && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-zinc-400 mb-2">Max Players</p>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPlayers(n)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                      style={{
                        background: maxPlayers === n ? "rgba(16,185,129,0.15)" : "#1a1a1a",
                        border: `1px solid ${maxPlayers === n ? "rgba(16,185,129,0.5)" : "#2a2a2a"}`,
                        color: maxPlayers === n ? "#10b981" : "#71717a",
                        boxShadow: maxPlayers === n ? "0 0 12px rgba(16,185,129,0.2)" : "none",
                      }}
                    >
                      {n} Players
                    </button>
                  ))}
                </div>
              </div>
            )}
            {gameMode === "teams" && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                Teams mode requires exactly 4 players (2v2)
              </div>
            )}

            {/* Points Target */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-zinc-400 mb-2">Points Target</p>
              <div className="flex gap-2">
                {POINTS_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPointsToWin(p)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                    style={{
                      background: pointsToWin === p ? "rgba(217,119,6,0.15)" : "#1a1a1a",
                      border: `1px solid ${pointsToWin === p ? "rgba(217,119,6,0.5)" : "#2a2a2a"}`,
                      color: pointsToWin === p ? "#f59e0b" : "#71717a",
                      boxShadow: pointsToWin === p ? "0 0 12px rgba(217,119,6,0.2)" : "none",
                    }}
                  >
                    {p} pts
                  </button>
                ))}
              </div>
            </div>

            {/* Max Rounds */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2">Max Rounds</p>
              <div className="flex gap-2">
                {ROUND_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMaxRounds(r)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                    style={{
                      background: maxRounds === r ? "rgba(16,185,129,0.15)" : "#1a1a1a",
                      border: `1px solid ${maxRounds === r ? "rgba(16,185,129,0.5)" : "#2a2a2a"}`,
                      color: maxRounds === r ? "#10b981" : "#71717a",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border p-5"
            style={{ background: "#111111", borderColor: "#222222" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest" style={{ color: "#52525b" }}>
                  Privacy
                </label>
                <p className="text-xs mt-0.5 text-zinc-500">
                  {isPrivate ? "Invite-only. Share the code with your lions." : "Anyone can see and join this table."}
                </p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(!isPrivate);
                  if (!isPrivate) setInviteCode(generateInviteCode());
                }}
                className="relative h-7 w-12 rounded-full transition-all shrink-0"
                style={{
                  background: isPrivate
                    ? "linear-gradient(135deg, #d97706, #f59e0b)"
                    : "#2a2a2a",
                  boxShadow: isPrivate ? "0 0 12px rgba(217,119,6,0.4)" : "none",
                }}
              >
                <div
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all"
                  style={{ left: isPrivate ? "calc(100% - 26px)" : "2px" }}
                />
              </button>
            </div>

            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{
                      background: "rgba(217,119,6,0.1)",
                      border: "1px solid rgba(217,119,6,0.3)",
                    }}
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>
                        Invite Code
                      </p>
                      <p className="text-2xl font-black tracking-[0.25em] text-white">
                        {inviteCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInviteCode(generateInviteCode())}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      ↺ New Code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-4 text-base font-black text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: loading
                  ? "#1a1a1a"
                  : "linear-gradient(135deg, #d97706, #f59e0b)",
                boxShadow: loading ? "none" : "0 0 24px rgba(217,119,6,0.4), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {loading ? "Creating Table..." : "✦ CREATE TABLE"}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
