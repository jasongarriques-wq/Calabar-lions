"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import DominoTileComponent from "@/components/domino-tile";
import type {
  DominoTile,
  GameMessage,
  GameMode,
  GamePlayer,
  GameRoom,
  GameSession,
  PlacedTile,
  BlockedGameResult,
  Reaction,
} from "@/types";

// ── Game logic helpers ──────────────────────────────────────────────────────────

function generateTileSet(mode: GameMode): DominoTile[] {
  const max = mode === "nine-nine" ? 9 : 6;
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= max; i++)
    for (let j = i; j <= max; j++) {
      // 9-9 mode excludes the double blank [0,0]
      if (mode === "nine-nine" && i === 0 && j === 0) continue;
      tiles.push([i, j]);
    }
  return tiles; // 9-9: 54 tiles (55 minus double blank), standard: 28 tiles
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealTiles(playerCount: number, mode: GameMode) {
  const tiles = mode === "french" ? generateTileSet(mode) : shuffle(generateTileSet(mode));
  const perPlayer = mode === "nine-nine" ? (playerCount <= 2 ? 13 : 10) : 7;
  const hands: DominoTile[][] = [];
  for (let i = 0; i < playerCount; i++) {
    hands.push(tiles.slice(i * perPlayer, (i + 1) * perPlayer));
  }
  const boneyard = tiles.slice(playerCount * perPlayer);
  return { hands, boneyard };
}

// ── 4-arm game helpers ──────────────────────────────────────────────────────

/** Returns which arms a tile can play on. "first" = empty board. */
function canPlayEnds(
  tile: DominoTile,
  leftEnd: number | null,
  rightEnd: number | null,
  topEnd: number | null,
  bottomEnd: number | null
): Array<"left" | "right" | "top" | "bottom"> | "first" | "none" {
  // Board is empty only when ALL four ends are null.
  // (effectiveLeftEnd/Right can be null due to the Caribbean arm constraint
  //  even when the board has tiles — do NOT use leftEnd===null alone.)
  if (leftEnd === null && rightEnd === null && topEnd === null && bottomEnd === null) return "first";
  const v0 = tile[0], v1 = tile[1];
  const matches: Array<"left" | "right" | "top" | "bottom"> = [];
  if (leftEnd   !== null && (v0 === leftEnd   || v1 === leftEnd))   matches.push("left");
  if (rightEnd  !== null && (v0 === rightEnd  || v1 === rightEnd))  matches.push("right");
  if (topEnd    !== null && (v0 === topEnd    || v1 === topEnd))    matches.push("top");
  if (bottomEnd !== null && (v0 === bottomEnd || v1 === bottomEnd)) matches.push("bottom");
  return matches.length > 0 ? matches : "none";
}

function canPlay4(
  tile: DominoTile,
  leftEnd: number | null,
  rightEnd: number | null,
  topEnd: number | null,
  bottomEnd: number | null
): boolean {
  const r = canPlayEnds(tile, leftEnd, rightEnd, topEnd, bottomEnd);
  return r !== "none";
}

// Keep old 2-end helpers for legacy compatibility
function canPlayTile(tile: DominoTile, leftEnd: number | null, rightEnd: number | null) {
  if (leftEnd === null) return "first" as const;
  const matchLeft  = tile[0] === leftEnd  || tile[1] === leftEnd;
  const matchRight = tile[0] === rightEnd || tile[1] === rightEnd;
  if (matchLeft && matchRight) return "both" as const;
  if (matchLeft) return "left" as const;
  if (matchRight) return "right" as const;
  return "none" as const;
}
function canPlay(tile: DominoTile, leftEnd: number | null, rightEnd: number | null): boolean {
  return canPlayTile(tile, leftEnd, rightEnd) !== "none";
}

/**
 * Compute the exposed (free) pip at the tip of a given arm.
 *
 * Flip conventions — deliberately asymmetric by design:
 *   LEFT/TOP arms  ("left" convention):
 *     tile[0] === connectingEnd  →  flipped = true   →  tile[1] is the free pip
 *     tile[1] === connectingEnd  →  flipped = false  →  tile[0] is the free pip
 *     ∴  free pip = flipped ? tile[1] : tile[0]
 *
 *   RIGHT/BOTTOM arms ("right" convention):
 *     tile[0] === connectingEnd  →  flipped = false  →  tile[1] is the free pip
 *     tile[1] === connectingEnd  →  flipped = true   →  tile[0] is the free pip
 *     ∴  free pip = flipped ? tile[0] : tile[1]
 *
 * Both conventions produce correct visual rendering via:
 *   display tile = flipped ? [tile[1], tile[0]] : tile
 * (connecting pip faces inward, free pip faces outward toward the table edge)
 */
function computeArmEnd(
  armTiles: PlacedTile[],
  spinnerValue: number,
  convention: "left" | "right"
): number {
  if (armTiles.length === 0) return spinnerValue;
  const last = armTiles[armTiles.length - 1];
  if (convention === "left") return last.flipped ? last.tile[1] : last.tile[0];
  return last.flipped ? last.tile[0] : last.tile[1];
}

function pipSum(tile: DominoTile) {
  return tile[0] + tile[1];
}

function sortHand(hand: DominoTile[]): DominoTile[] {
  return [...hand].sort((a, b) => pipSum(b) - pipSum(a));
}

function calculatePips(hand: DominoTile[]): number {
  return hand.reduce((sum, [a, b]) => sum + a + b, 0);
}

// ── Constants ──────────────────────────────────────────────────────────────────

const QUICK_CHATS = [
  "Good play! 👏",
  "Well played! 🎯",
  "Nice block! 🛡️",
  "Let's go! 💪",
  "Unlucky! 😅",
  "Thanks! 🙏",
];

const REACTIONS = ["🔥", "😂", "👏", "💪", "😤", "🦁"];

const MODE_LABELS: Record<GameMode, string> = {
  draw: "Draw Dominoes",
  teams: "Teams 2v2",
  french: "French Dominoes",
  "nine-nine": "9-9 Dominoes",
};

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "lobby" | "playing" | "blocked" | "gameOver" | "seriesOver";
type ChatTab = "chat" | "players";

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface Props {
  room: GameRoom;
  currentProfile: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    username?: string;
  } | null;
}

// ── Avatar component ───────────────────────────────────────────────────────────

function PlayerAvatar({
  name,
  score,
  isActive,
  tileCount,
  isMe,
  size = 40,
}: {
  name: string;
  score: number;
  isActive: boolean;
  tileCount: number;
  isMe?: boolean;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: isMe
            ? "linear-gradient(135deg, #059669, #0d4a2a)"
            : "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.35,
          fontWeight: 900,
          color: "white",
          position: "relative",
          border: isActive ? "2px solid #10b981" : "2px solid #2a2a2a",
          boxShadow: isActive ? "0 0 0 3px rgba(16,185,129,0.3)" : "none",
          flexShrink: 0,
        }}
        animate={
          isActive
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(16,185,129,0.4)",
                  "0 0 0 8px rgba(16,185,129,0)",
                  "0 0 0 0 rgba(16,185,129,0.4)",
                ],
              }
            : {}
        }
        transition={isActive ? { repeat: Infinity, duration: 1.8 } : {}}
      >
        {initials}
        {/* Score badge */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            background: "linear-gradient(135deg, #d97706, #f59e0b)",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontWeight: 900,
            color: "#1a0a00",
            border: "1px solid #1a1a1a",
          }}
        >
          {score}
        </div>
      </motion.div>
      <div className="text-center leading-none">
        <p className="text-[9px] font-black text-white truncate max-w-[52px]">
          {name.split(" ")[0]}
        </p>
        <p className="text-[8px]" style={{ color: "#10b981" }}>
          {tileCount}🀱
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GameClient({ room, currentProfile }: Props) {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [session, setSession] = useState<GameSession | null>(null);
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null);
  const [allPlayers, setAllPlayers] = useState<GamePlayer[]>([]);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("lobby");
  const [chatTab, setChatTab] = useState<ChatTab>("chat");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allRooms, setAllRooms] = useState<GameRoom[]>([]);
  const [blockedResults, setBlockedResults] = useState<BlockedGameResult[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [lastPlacedIdx, setLastPlacedIdx] = useState<number | null>(null);
  const [showEndChoices, setShowEndChoices] = useState(false);
  const [draggedTileIdx, setDraggedTileIdx] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [autoRestartCount, setAutoRestartCount] = useState<number | null>(null);
  const autoRestartRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  // Ref so realtime callbacks always have the latest session id without stale closures
  const sessionIdRef = useRef<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const addFloatingReaction = (emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = 20 + Math.random() * 60; // percentage
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const isMyTurn = session?.current_turn === currentProfile?.id;
  const myHand   = myPlayer?.hand ?? [];
  const leftEnd  = session?.left_end  ?? null;
  const rightEnd = session?.right_end ?? null;

  // ── Spinner / 4-arm derived values ────────────────────────────────────────
  const boardTiles   = session?.board ?? [];
  // Spinner = first double in board (any arm)
  const spinnerTile  = boardTiles.find(t => t.tile[0] === t.tile[1] && t.arm !== undefined);
  const spinnerValue = spinnerTile ? spinnerTile.tile[0] : null;
  const hasSpinner   = spinnerValue !== null;

  const topArm    = boardTiles.filter(t => t.arm === "top");
  const bottomArm = boardTiles.filter(t => t.arm === "bottom");
  const topEnd    = hasSpinner ? computeArmEnd(topArm,    spinnerValue!, "left")  : null;
  const bottomEnd = hasSpinner ? computeArmEnd(bottomArm, spinnerValue!, "right") : null;

  // ── Caribbean arm constraint ──────────────────────────────────────────────
  // Left/right arms can only extend once top AND bottom each have ≥1 tile.
  const leftRightBlocked = hasSpinner && (topArm.length === 0 || bottomArm.length === 0);
  const effectiveLeftEnd  = leftRightBlocked ? null : leftEnd;
  const effectiveRightEnd = leftRightBlocked ? null : rightEnd;

  const playable    = myHand.map(t => canPlay4(t, effectiveLeftEnd, effectiveRightEnd, topEnd, bottomEnd));
  const hasPlayable = playable.some(Boolean);
  const boneyardEmpty = (session?.boneyard?.length ?? 0) === 0;
  const gameMode: GameMode = (room.game_mode as GameMode) ?? "draw";

  const orderedPlayers = [...allPlayers].sort((a, b) => {
    const myId = currentProfile?.id;
    if (a.profile_id === myId) return -1;
    if (b.profile_id === myId) return 1;
    return a.seat - b.seat;
  });

  const me             = orderedPlayers[0] ?? null;
  const opponentLeft   = orderedPlayers[1] ?? null;
  const opponentTop    = orderedPlayers[2] ?? null;
  const opponentRight  = orderedPlayers[3] ?? null;
  const isHost         = room.created_by === currentProfile?.id;
  const alreadySeated  = allPlayers.some(p => p.profile_id === currentProfile?.id);

  const selectedTileObj = selectedTile !== null ? myHand[selectedTile] : null;
  // All arms the selected tile can play on (respecting Caribbean arm constraint)
  const selectedPlayEnds = selectedTileObj && session
    ? canPlayEnds(selectedTileObj, effectiveLeftEnd, effectiveRightEnd, topEnd, bottomEnd)
    : null;
  const canPlayAny   = selectedPlayEnds !== null && selectedPlayEnds !== "none";
  const needsChoice  = Array.isArray(selectedPlayEnds) && selectedPlayEnds.length > 1;

  // ── Load initial data ──────────────────────────────────────────────────────

  const loadGameData = useCallback(async () => {
    if (!currentProfile) return;

    // Fetch session first so we can filter players by session_id
    const { data: sessionData } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("room_id", room.id)
      .maybeSingle();

    const [{ data: messagesData }, { data: roomsData }] = await Promise.all([
      supabase
        .from("game_messages")
        .select("*, profiles(full_name, display_name)")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase.from("game_rooms").select("*").order("created_at", { ascending: true }),
    ]);

    if (sessionData) {
      const s = sessionData as any;
      sessionIdRef.current = s.id;
      const mapped: GameSession = {
        ...s,
        board: s.board ?? [],
        boneyard: s.boneyard ?? [],
        scores: s.scores ?? {},
        consecutive_passes: s.consecutive_passes ?? 0,
      };
      setSession(mapped);
      setGamePhase(s.status === "finished" ? "gameOver" : "playing");

      // Now fetch players filtered by this session's id
      const { data: playersData } = await supabase
        .from("game_players")
        .select("*, profiles(full_name, display_name)")
        .eq("session_id", s.id)
        .order("seat", { ascending: true });

      if (playersData) {
        const players = (playersData as any[]).map((p) => ({
          ...p,
          display_name: p.profiles?.full_name ?? p.profiles?.display_name ?? "Player",
          username: "",
          hand: Array.isArray(p.hand) ? p.hand : [],
          tile_count: Array.isArray(p.hand) ? p.hand.length : 0,
        })) as GamePlayer[];
        setAllPlayers(players);
        const me = players.find((p) => p.profile_id === currentProfile.id);
        if (me) setMyPlayer(me);
      }
    } else {
      setGamePhase("lobby");
    }

    if (messagesData) {
      setMessages(
        (messagesData as any[]).map((m) => ({
          ...m,
          display_name: m.profiles?.full_name ?? "Player",
        }))
      );
    }

    if (roomsData) setAllRooms(roomsData as GameRoom[]);
    setLoading(false);
  }, [currentProfile, room.id]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Keep the ref in sync so realtime callbacks never use a stale session id
  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollLeft = boardRef.current.scrollWidth;
    }
  }, [session?.board?.length]);

  // ── Realtime subscriptions ─────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`game-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const s = payload.new as any;
          if (!s) return;
          sessionIdRef.current = s.id;
          const mapped: GameSession = {
            ...s,
            board: s.board ?? [],
            boneyard: s.boneyard ?? [],
            scores: s.scores ?? {},
            consecutive_passes: s.consecutive_passes ?? 0,
          };
          setSession(mapped);
          if (s.status === "finished") setGamePhase("gameOver");
          else if (s.status === "active") setGamePhase("playing");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players" },
        async () => {
          // Use ref to avoid stale closure — always has the latest session id
          const sid = sessionIdRef.current;
          if (!sid) return;
          const { data } = await supabase
            .from("game_players")
            .select("*, profiles(full_name, display_name)")
            .eq("session_id", sid)
            .order("seat", { ascending: true });
          if (data) {
            const players = (data as any[]).map((p) => ({
              ...p,
              display_name: p.profiles?.full_name ?? p.profiles?.display_name ?? "Player",
              username: "",
              hand: Array.isArray(p.hand) ? p.hand : [],
              tile_count: Array.isArray(p.hand) ? p.hand.length : 0,
            })) as GamePlayer[];
            setAllPlayers(players);
            const me = players.find((p) => p.profile_id === currentProfile?.id);
            if (me) setMyPlayer(me);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_messages", filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.profile_id)
            .single();
          setMessages((prev) => [
            ...prev,
            { ...msg, display_name: (profileData as any)?.full_name ?? "Player" },
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "table_reactions", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const r = payload.new as any;
          if (r?.emoji) addFloatingReaction(r.emoji);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${room.id}` },
        () => { loadGameData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id, session?.id, currentProfile?.id]);

  // ── Auto-restart countdown when game ends ─────────────────────────────────
  useEffect(() => {
    if (gamePhase === "gameOver") {
      setAutoRestartCount(5);
      autoRestartRef.current = setInterval(() => {
        setAutoRestartCount(prev => {
          if (prev === null || prev <= 0) return prev;
          return prev - 1;           // counts 5 → 4 → 3 → 2 → 1 → 0
        });
      }, 1000);
    } else {
      if (autoRestartRef.current) {
        clearInterval(autoRestartRef.current);
        autoRestartRef.current = null;
      }
      setAutoRestartCount(null);
    }
    return () => {
      if (autoRestartRef.current) {
        clearInterval(autoRestartRef.current);
        autoRestartRef.current = null;
      }
    };
  }, [gamePhase]);

  // Fire handleStartGame the moment countdown hits 0 — HOST ONLY.
  // Other clients receive the new hand via the realtime subscription.
  useEffect(() => {
    if (autoRestartCount !== 0) return;
    if (autoRestartRef.current) {
      clearInterval(autoRestartRef.current);
      autoRestartRef.current = null;
    }
    if (isHost) handleStartGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRestartCount]);

  // ── Game actions ───────────────────────────────────────────────────────────

  function getNextTurn(players: GamePlayer[], currentTurnId: string): string {
    const seats = [...players].sort((a, b) => a.seat - b.seat);
    const idx = seats.findIndex((p) => p.profile_id === currentTurnId);
    const next = seats[(idx + 1) % seats.length];
    return next?.profile_id ?? currentTurnId;
  }

  async function handleJoinGame() {
    if (!currentProfile || !session) return;
    setActionLoading(true);
    const takenSeats = allPlayers.map((p) => p.seat);
    const availableSeat = [0, 1, 2, 3].find((s) => !takenSeats.includes(s));
    if (availableSeat === undefined) { showToast("Table is full!"); setActionLoading(false); return; }
    await supabase.from("game_players").upsert(
      { session_id: session.id, profile_id: currentProfile.id, seat: availableSeat, hand: [], score: 0 },
      { onConflict: "session_id,profile_id" }
    );
    await supabase.from("game_rooms").update({ current_players: allPlayers.length + 1 }).eq("id", room.id);
    setActionLoading(false);
  }

  async function handleStartGame(resetScores = false) {
    // ── HOST ONLY: only one client shuffles and writes hands to DB.
    // All other clients receive the new game state via realtime subscription.
    if (!currentProfile || !isHost) { setActionLoading(false); return; }
    setActionLoading(true);

    const mode = gameMode;
    const seatedPlayers = allPlayers.length > 0 ? allPlayers : [];
    const playerCount = Math.max(seatedPlayers.length, 1);
    const { hands, boneyard } = dealTiles(playerCount, mode);

    // Determine first player:
    //   Round 1 → player with the highest double (double-six starts)
    //   Round 2+ → winner of the previous round (stored in session.current_turn)
    const isFirstGame = !session?.id;
    let firstTurnIdx = 0;
    if (isFirstGame) {
      let highestDouble = -1;
      hands.forEach((hand, i) => {
        hand.forEach((tile) => {
          if (tile[0] === tile[1] && tile[0] > highestDouble) {
            highestDouble = tile[0];
            firstTurnIdx = i;
          }
        });
      });
    }

    let sessionId = session?.id;
    if (!sessionId) {
      const scores: Record<string, number> = {};
      seatedPlayers.forEach((p) => { scores[p.profile_id] = p.score ?? 0; });
      if (!scores[currentProfile.id]) scores[currentProfile.id] = 0;

      const { data: newSession } = await supabase
        .from("game_sessions")
        .insert({
          room_id: room.id,
          round_number: 1,
          max_rounds: room.max_rounds ?? 10,
          current_turn: currentProfile.id,
          status: "active",
          board: [],
          boneyard,
          left_end: null,
          right_end: null,
          scores,
          consecutive_passes: 0,
        })
        .select()
        .single();
      sessionId = (newSession as any)?.id;
    }

    if (!sessionId) { setActionLoading(false); return; }

    const allProfileIds = seatedPlayers.map((p) => p.profile_id);
    if (!allProfileIds.includes(currentProfile.id)) allProfileIds.push(currentProfile.id);

    // Write each player's hand to DB
    for (let i = 0; i < allProfileIds.length; i++) {
      const profileId = allProfileIds[i];
      const existing = seatedPlayers.find((p) => p.profile_id === profileId);
      await supabase.from("game_players").upsert(
        { session_id: sessionId, profile_id: profileId, seat: existing?.seat ?? i, hand: hands[i] ?? [], score: existing?.score ?? 0 },
        { onConflict: "session_id,profile_id" }
      );
    }

    // For subsequent rounds, the winner (stored in session.current_turn) goes first.
    // For the very first game, use the player with the highest double.
    let firstTurnProfileId: string;
    if (!isFirstGame && session?.current_turn && allProfileIds.includes(session.current_turn)) {
      firstTurnProfileId = session.current_turn;
    } else {
      firstTurnProfileId = allProfileIds[firstTurnIdx] ?? currentProfile.id;
    }
    const scores: Record<string, number> = {};
    allProfileIds.forEach((id) => {
      // resetScores = true when starting a fresh series; otherwise carry wins forward
      scores[id] = resetScores ? 0 : (seatedPlayers.find((p) => p.profile_id === id)?.score ?? 0);
    });

    const newSession: GameSession = {
      id: sessionId,
      room_id: room.id,
      round_number: 1,
      max_rounds: room.max_rounds ?? 10,
      current_turn: firstTurnProfileId,
      status: "active",
      board: [],
      boneyard,
      left_end: null,
      right_end: null,
      scores,
      consecutive_passes: 0,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("game_sessions").update({
      current_turn: firstTurnProfileId,
      boneyard,
      board: [],
      left_end: null,
      right_end: null,
      status: "active",
      round_number: 1,
      consecutive_passes: 0,
      scores,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    await supabase.from("game_rooms").update({ status: "playing", current_players: allProfileIds.length }).eq("id", room.id);

    // ── Set state directly from computed data — no DB round-trip needed ──────
    // This avoids RLS / timing issues where the re-fetch returns stale/empty rows.
    sessionIdRef.current = sessionId;
    setSession(newSession);

    const builtPlayers: GamePlayer[] = allProfileIds.map((profileId, i) => {
      const existing = seatedPlayers.find((p) => p.profile_id === profileId);
      return {
        id: existing?.id ?? `local-${i}`,
        session_id: sessionId!,
        profile_id: profileId,
        seat: existing?.seat ?? i,
        hand: hands[i] ?? [],
        tile_count: (hands[i] ?? []).length,
        score: existing?.score ?? 0,
        display_name:
          profileId === currentProfile.id
            ? (currentProfile.full_name ?? currentProfile.display_name ?? "Lion")
            : (existing?.display_name ?? "Player"),
        username: existing?.username ?? "",
      };
    });

    setAllPlayers(builtPlayers);
    const me = builtPlayers.find((p) => p.profile_id === currentProfile.id);
    if (me) setMyPlayer(me);

    setGamePhase("playing");
    setActionLoading(false);
  }

  async function handlePlayTile(end: "left" | "right" | "top" | "bottom" | "auto", explicitIdx?: number) {
    const tileIdx = explicitIdx ?? selectedTile;
    if (!session || !myPlayer || tileIdx === null || !currentProfile) return;
    if (!isMyTurn) { showToast("It's not your turn!"); return; }

    const tile    = myHand[tileIdx];

    const matches = canPlayEnds(tile, effectiveLeftEnd, effectiveRightEnd, topEnd, bottomEnd);
    if (matches === "none") { showToast("That tile can't be played here!"); return; }

    setActionLoading(true);

    const board = [...(session.board ?? [])];
    let lEnd = session.left_end;
    let rEnd = session.right_end;
    let tEnd = topEnd;
    let bEnd = bottomEnd;
    let flipped = false;
    let arm: PlacedTile["arm"];

    if (lEnd === null) {
      // ── First tile ever ──────────────────────────────────────────────────
      arm  = "right";
      lEnd = tile[0];
      rEnd = tile[1];
      // If the first tile is a double, it immediately becomes the spinner
      if (tile[0] === tile[1]) { tEnd = tile[0]; bEnd = tile[0]; }
      board.push({ tile, flipped: false, arm });
    } else {
      // ── Determine which end ──────────────────────────────────────────────
      let playSide: "left" | "right" | "top" | "bottom";
      if (end === "auto") {
        if (matches === "first") { showToast("Board error"); setActionLoading(false); return; }
        playSide = (matches as Array<"left"|"right"|"top"|"bottom">)[0];
      } else {
        playSide = end;
        if (Array.isArray(matches) && !matches.includes(playSide)) {
          showToast("That tile doesn't match that end!"); setActionLoading(false); return;
        }
      }

      // ── Caribbean arm constraint: top & bottom must each have ≥1 tile
      //    before left/right arms can extend ────────────────────────────────
      if ((playSide === "left" || playSide === "right") && leftRightBlocked) {
        showToast("Play on the top or bottom arm first! ☝️"); setActionLoading(false); return;
      }

      if (playSide === "right") {
        if (tile[0] === rEnd!) { flipped = false; rEnd = tile[1]; }
        else                   { flipped = true;  rEnd = tile[0]; }
        arm = "right";
        board.push({ tile, flipped, arm });
      } else if (playSide === "left") {
        if (tile[0] === lEnd!) { flipped = true;  lEnd = tile[1]; }
        else                   { flipped = false; lEnd = tile[0]; }
        arm = "left";
        board.unshift({ tile, flipped, arm });
      } else if (playSide === "top") {
        if (tEnd === null) { showToast("Top arm not open yet!"); setActionLoading(false); return; }
        if (tile[0] === tEnd) { flipped = true;  tEnd = tile[1]; }
        else                  { flipped = false; tEnd = tile[0]; }
        arm = "top";
        board.push({ tile, flipped, arm });
      } else { // bottom
        if (bEnd === null) { showToast("Bottom arm not open yet!"); setActionLoading(false); return; }
        if (tile[0] === bEnd) { flipped = false; bEnd = tile[1]; }
        else                  { flipped = true;  bEnd = tile[0]; }
        arm = "bottom";
        board.push({ tile, flipped, arm });
      }

      // ── Any subsequent double on left/right arm opens top/bottom ────────
      if (tile[0] === tile[1] && !hasSpinner && (playSide === "left" || playSide === "right")) {
        tEnd = tile[0];
        bEnd = tile[0];
      }
    }

    const newHand   = myHand.filter((_, i) => i !== tileIdx);
    const nextTurn  = getNextTurn(allPlayers, currentProfile.id);
    const newScores = { ...(session.scores ?? {}) };

    await supabase.from("game_players").update({ hand: newHand }).eq("id", myPlayer.id);
    setLastPlacedIdx(board.length - 1);

    if (newHand.length === 0) {
      // ── DOMINO! ─────────────────────────────────────────────────────────
      showToast("🀱 DOMINO!");

      // ── Caribbean series scoring: each hand won = +1 win ─────────────────
      const myPlayer_ = allPlayers.find(p => p.profile_id === currentProfile.id);
      const mySeat    = myPlayer_?.seat ?? 0;
      const isTeams   = gameMode === "teams";
      const seriesTarget = room.points_to_win ?? 6;

      if (isTeams) {
        // Both partners get +1
        allPlayers
          .filter(p => p.seat % 2 === mySeat % 2)
          .forEach(p => { newScores[p.profile_id] = (newScores[p.profile_id] ?? 0) + 1; });
      } else {
        newScores[currentProfile.id] = (newScores[currentProfile.id] ?? 0) + 1;
      }

      // Check if series is now won
      const myNewWins   = newScores[currentProfile.id] ?? 0;
      const seriesWon   = myNewWins >= seriesTarget;
      const nextPhase: GamePhase = seriesWon ? "seriesOver" : "gameOver";

      // Store winner as current_turn so next hand knows who plays first
      await supabase.from("game_sessions").update({
        board, left_end: lEnd, right_end: rEnd, current_turn: currentProfile.id,
        scores: newScores, status: "finished", consecutive_passes: 0,
        updated_at: new Date().toISOString(),
      }).eq("id", session.id);
      await supabase.from("game_rooms").update({ status: "finished" }).eq("id", room.id);
      setGamePhase(nextPhase);
    } else {
      await supabase.from("game_sessions").update({
        board, left_end: lEnd, right_end: rEnd, current_turn: nextTurn,
        consecutive_passes: 0, updated_at: new Date().toISOString(),
      }).eq("id", session.id);
    }

    setSelectedTile(null);
    setShowEndChoices(false);
    setActionLoading(false);
  }

  async function handleDraw() {
    if (!session || !myPlayer || !currentProfile) return;
    if (!isMyTurn) { showToast("Not your turn!"); return; }
    if (boneyardEmpty) { showToast("Boneyard is empty!"); return; }

    setActionLoading(true);
    const boneyard = [...session.boneyard];
    const drawn = boneyard.pop()!;
    const newHand = [...myHand, drawn];

    await Promise.all([
      supabase.from("game_players").update({ hand: newHand }).eq("id", myPlayer.id),
      supabase.from("game_sessions").update({ boneyard, updated_at: new Date().toISOString() }).eq("id", session.id),
    ]);

    setActionLoading(false);
    showToast(`Drew: ${drawn[0]}-${drawn[1]}`);
  }

  async function handlePass() {
    if (!session || !myPlayer || !currentProfile) return;
    if (!isMyTurn) { showToast("Not your turn!"); return; }
    if (hasPlayable) { showToast("You have playable tiles — you must play!"); return; }

    setActionLoading(true);
    const nextTurn = getNextTurn(allPlayers, currentProfile.id);
    const newPasses = (session.consecutive_passes ?? 0) + 1;

    // Check blocked: all players passed
    if (newPasses >= allPlayers.length) {
      // ── Re-fetch all hands from DB for accurate pip counts ────────────────
      // Local state may be stale due to realtime lag; DB is the source of truth.
      const { data: freshPlayers } = await supabase
        .from("game_players")
        .select("profile_id, hand")
        .eq("session_id", session.id);

      const results: BlockedGameResult[] = allPlayers.map((p) => {
        const freshHand = freshPlayers?.find(fp => fp.profile_id === p.profile_id)?.hand ?? p.hand ?? [];
        const pips = calculatePips(freshHand as DominoTile[]);
        return { playerId: p.profile_id, displayName: p.display_name, remainingPips: pips, isWinner: false };
      });
      results.sort((a, b) => a.remainingPips - b.remainingPips);
      if (results.length > 0) results[0].isWinner = true;

      setBlockedResults(results);
      setGamePhase("blocked");

      // ── Caribbean blocked scoring ─────────────────────────────────────────
      // Lowest pip total wins. In teams, lowest combined team pip total wins.
      // ── Caribbean series scoring: blocked hand winner gets +1 win ─────────
      const newScores = { ...(session.scores ?? {}) };
      const seriesTarget = room.points_to_win ?? 6;
      const blockWinnerId = results[0]?.playerId ?? nextTurn;

      if (results[0]) {
        const isTeams = gameMode === "teams";
        if (isTeams) {
          const winnerPlayer = allPlayers.find(p => p.profile_id === results[0].playerId);
          const winnerSeat   = winnerPlayer?.seat ?? 0;
          allPlayers
            .filter(p => p.seat % 2 === winnerSeat % 2)
            .forEach(p => { newScores[p.profile_id] = (newScores[p.profile_id] ?? 0) + 1; });
        } else {
          newScores[results[0].playerId] = (newScores[results[0].playerId] ?? 0) + 1;
        }
      }

      // Check series win
      const blockWinnerNewScore = newScores[blockWinnerId] ?? 0;
      const blockSeriesWon = blockWinnerNewScore >= seriesTarget;

      // Store winner as current_turn so next round knows who plays first
      await supabase.from("game_sessions").update({
        current_turn: blockWinnerId, consecutive_passes: newPasses, scores: newScores,
        status: "finished", updated_at: new Date().toISOString(),
      }).eq("id", session.id);
      await supabase.from("game_rooms").update({ status: "finished" }).eq("id", room.id);
      setGamePhase(blockSeriesWon ? "seriesOver" : "blocked");
    } else {
      await supabase.from("game_sessions").update({
        current_turn: nextTurn, consecutive_passes: newPasses,
        updated_at: new Date().toISOString(),
      }).eq("id", session.id);
    }

    setActionLoading(false);
    showToast("🤜 Knocked!");
  }

  function handleSort() {
    if (!myPlayer) return;
    const sorted = sortHand(myHand);
    setMyPlayer({ ...myPlayer, hand: sorted });
    setSelectedTile(null);
  }

  function handleTileClick(i: number) {
    if (!isMyTurn) return;
    if (selectedTile === i) {
      setSelectedTile(null);
      setShowEndChoices(false);
    } else {
      setSelectedTile(i);
      setShowEndChoices(false);
    }
  }

  function handleDoubleClickTile(i: number) {
    if (!isMyTurn) return;
    const tile    = myHand[i];
    // Use effectiveLeftEnd/Right so the Caribbean arm constraint is respected
    const matches = canPlayEnds(tile, effectiveLeftEnd, effectiveRightEnd, topEnd, bottomEnd);
    if (matches === "none") { showToast("That tile can't be played here!"); return; }
    if (Array.isArray(matches) && matches.length > 1) {
      setSelectedTile(i);
      setShowEndChoices(true);
    } else {
      setSelectedTile(i);
      handlePlayTile("auto", i);
    }
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    if (!isMyTurn) { e.preventDefault(); return; }
    e.dataTransfer.setData("tileIdx", String(i));
    e.dataTransfer.effectAllowed = "move";
    setDraggedTileIdx(i);
    setSelectedTile(i);
  }

  function handleDragEnd() {
    setDraggedTileIdx(null);
  }

  function handleBoardDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!isMyTurn) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleBoardDragLeave() {
    setIsDragOver(false);
  }

  function handleBoardDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (!isMyTurn) return;
    const idx = parseInt(e.dataTransfer.getData("tileIdx"), 10);
    if (isNaN(idx) || idx < 0 || idx >= myHand.length) return;
    const tile    = myHand[idx];
    // Use effectiveLeftEnd/Right so the Caribbean arm constraint is respected
    const matches = canPlayEnds(tile, effectiveLeftEnd, effectiveRightEnd, topEnd, bottomEnd);
    if (matches === "none") { showToast("That tile can't play here!"); setDraggedTileIdx(null); return; }

    if (Array.isArray(matches) && matches.length > 1) {
      // Determine arm from drop position relative to board center
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width  / 2;
      const relY = e.clientY - rect.top  - rect.height / 2;
      const preferH = Math.abs(relX) >= Math.abs(relY);
      let preferred: "left" | "right" | "top" | "bottom" =
        preferH ? (relX < 0 ? "left" : "right") : (relY < 0 ? "top" : "bottom");
      if (!matches.includes(preferred)) preferred = matches[0];
      setSelectedTile(idx);
      handlePlayTile(preferred, idx);
    } else {
      setSelectedTile(idx);
      handlePlayTile("auto", idx);
    }
    setDraggedTileIdx(null);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || !currentProfile) return;
    await supabase.from("game_messages").insert({
      room_id: room.id,
      profile_id: currentProfile.id,
      message: text.trim(),
    });
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput("");
  }

  async function sendReaction(emoji: string) {
    if (!currentProfile) return;
    addFloatingReaction(emoji); // immediate local
    await supabase.from("table_reactions").insert({
      room_id: room.id,
      profile_id: currentProfile.id,
      emoji,
    });
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderOpponentHand(player: GamePlayer | null, position: "top" | "left" | "right") {
    const isTop = position === "top";
    const isEmpty = !player;
    // Always show tiles — ghost when empty, real count when occupied
    const tileCount = isEmpty ? 5 : Math.min(player.tile_count ?? (player.hand?.length ?? 0), isTop ? 7 : 12);
    const isActive = !isEmpty && player.profile_id === session?.current_turn;

    return (
      <div className="flex flex-col items-center gap-1 select-none">
        {/* Avatar or empty-seat ghost */}
        {isEmpty ? (
          <div className="flex flex-col items-center gap-0.5 opacity-30">
            <div
              className="rounded-full border-2 border-dashed border-zinc-500 flex items-center justify-center"
              style={{ width: 28, height: 28, background: "rgba(0,0,0,0.4)" }}
            >
              <span className="text-zinc-400" style={{ fontSize: 11 }}>?</span>
            </div>
          </div>
        ) : (
          <PlayerAvatar
            name={player.display_name}
            score={player.score ?? 0}
            isActive={isActive}
            tileCount={player.tile_count ?? player.hand?.length ?? 0}
            size={28}
          />
        )}

        {/* Tiles — always rendered; dimmed when empty seat */}
        <div
          className={`flex ${isTop ? "flex-row" : "flex-col"} gap-px`}
          style={{ opacity: isEmpty ? 0.5 : 1 }}
        >
          {Array.from({ length: tileCount }).map((_, i) => (
            <DominoTileComponent
              key={i}
              tile={[0, 0]}
              facedown
              size={isTop ? 16 : 14}
              horizontal={isTop}
            />
          ))}
        </div>
      </div>
    );
  }

  function renderBoard() {
    if (!session?.board || session.board.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm font-bold opacity-30" style={{ color: "#1a6b3a" }}>
            Play the first tile to start
          </p>
        </div>
      );
    }

    const board = session.board;
    const spinner      = board.find(t => t.tile[0] === t.tile[1] && t.arm !== undefined);
    const leftArm      = board.filter(t => t.arm === "left");
    const rightArm     = board.filter(t => t.arm === "right" && t !== spinner);
    const topArmTiles  = board.filter(t => t.arm === "top");
    const botArmTiles  = board.filter(t => t.arm === "bottom");

    // ── Layout constants ─────────────────────────────────────────────────────
    const HALF    = 20;            // half-tile size (each pip square)
    const PER_ROW = 6;             // tiles per snake row
    const G       = 2;             // gap between tiles (px)
    const HW      = HALF * 2 + 1; // horizontal tile width  = 41 px
    const HH      = HALF;          // horizontal tile height = 20 px
    const VW      = HALF;          // vertical   tile width  = 20 px

    // Build horizontal chain: reversed leftArm → spinner → rightArm
    const leftArmRev: PlacedTile[] = spinner ? [...leftArm].reverse() : [];
    const hChain: PlacedTile[] = spinner
      ? [...leftArmRev, spinner, ...rightArm]
      : [...board];
    const spinnerIdx = spinner ? leftArmRev.length : -1;

    // Boustrophedon column: even rows L→R, odd rows R→L
    const boustCol = (i: number) => {
      const row = Math.floor(i / PER_ROW);
      const c   = i % PER_ROW;
      return row % 2 === 0 ? c : (PER_ROW - 1 - c);
    };

    // Horizontal pixel offset so arm container centres over spinner column
    const sCol  = spinnerIdx >= 0 ? boustCol(spinnerIdx) : 0;
    const armML = sCol * (HW + G) + Math.round((HW - VW) / 2);

    // ── Sub-renderers ────────────────────────────────────────────────────────
    const endBadge = (val: number) => (
      <div
        className="shrink-0 rounded px-1 py-0.5 text-[9px] font-black leading-none text-center"
        style={{
          background: "rgba(16,185,129,0.2)",
          color: "#10b981",
          border: "1px solid rgba(16,185,129,0.3)",
          width: VW,
        }}
      >
        {val}
      </div>
    );

    const renderTile = (pt: PlacedTile, key: string | number, horiz: boolean) => (
      <DominoTileComponent
        key={key}
        tile={pt.flipped ? [pt.tile[1], pt.tile[0]] : pt.tile}
        horizontal={horiz}
        size={HALF}
        justPlaced={session!.board.indexOf(pt) === lastPlacedIdx}
      />
    );

    return (
      <div
        ref={boardRef}
        className="flex flex-col items-start overflow-auto p-2"
        style={{ gap: G, scrollbarWidth: "none", maxHeight: "100%", maxWidth: "100%" }}
      >
        {/* ── Top arm: vertical tiles above the spinner column ── */}
        {spinner && (topArmTiles.length > 0 || topEnd !== null) && (
          <div className="flex flex-col-reverse" style={{ gap: G, marginLeft: armML }}>
            {/* flex-col-reverse: last source child → visual top, first → visual bottom */}
            {topArmTiles.map((pt, i) => renderTile(pt, `t${i}`, false))}
            {topEnd !== null && endBadge(topEnd)}
          </div>
        )}

        {/* ── Snake chain grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${PER_ROW}, ${HW}px)`,
            gridAutoRows: `${HH}px`,
            gap: `${G}px`,
          }}
        >
          {hChain.map((pt, i) => (
            <div
              key={i}
              style={{
                gridRow:    Math.floor(i / PER_ROW) + 1,
                gridColumn: boustCol(i) + 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {renderTile(pt, `h${i}`, true)}
            </div>
          ))}
        </div>

        {/* ── Bottom arm: vertical tiles below the spinner column ── */}
        {spinner && (botArmTiles.length > 0 || bottomEnd !== null) && (
          <div className="flex flex-col" style={{ gap: G, marginLeft: armML }}>
            {botArmTiles.map((pt, i) => renderTile(pt, `b${i}`, false))}
            {bottomEnd !== null && endBadge(bottomEnd!)}
          </div>
        )}

        {/* ── Chain end labels (which pips are exposed at each tail) ── */}
        <div className="flex gap-2 flex-wrap">
          {leftEnd !== null && (
            <div
              className="rounded px-2 py-0.5 text-[9px] font-black"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              ← {leftEnd}
            </div>
          )}
          {rightEnd !== null && (
            <div
              className="rounded px-2 py-0.5 text-[9px] font-black"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              {rightEnd} →
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Full render ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 border-b z-20"
        style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}
      >
        {/* Left: Logo + room info */}
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/play" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-800 to-zinc-900 border border-green-700/50">
              <span className="text-lg">🦁</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-green-400 leading-none">Calabar</p>
              <p className="text-sm font-black text-white leading-tight">LIONS</p>
              <p className="text-[8px] text-zinc-500 leading-none">DOMINO PLAY</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-5 border-l border-zinc-800 pl-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Room</p>
              <p className="text-xs font-black text-white">{room.name.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Game</p>
              <p className="text-xs font-black text-white">{MODE_LABELS[gameMode].toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Round</p>
              <p className="text-xs font-black text-white">{session?.round_number ?? 1}<span className="text-zinc-600">/{session?.max_rounds ?? room.max_rounds}</span></p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Series</p>
              <p className="text-xs font-black" style={{ color: "#f59e0b" }}>First to {room.points_to_win}</p>
            </div>
          </div>
        </div>

        {/* Right: Reactions + controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="rounded-lg w-8 h-8 text-sm transition-all hover:scale-110 active:scale-95 hover:bg-zinc-800 flex items-center justify-center"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button className="rounded-xl p-2 text-sm transition-colors hover:bg-zinc-800 border border-zinc-800" style={{ background: "#111" }}>🔊</button>
          <button className="rounded-xl p-2 text-sm transition-colors hover:bg-zinc-800 border border-zinc-800" style={{ background: "#111" }}>⚙️</button>
          <button className="rounded-xl p-2 text-sm transition-colors hover:bg-zinc-800 border border-zinc-800" style={{ background: "#111" }}>☰</button>
        </div>
      </header>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xl"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING REACTIONS ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -150, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{
                position: "absolute",
                bottom: "30%",
                left: `${r.x}%`,
                fontSize: 36,
                pointerEvents: "none",
              }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex w-56 shrink-0 flex-col gap-3 overflow-y-auto border-r p-3"
          style={{ background: "#111111", borderColor: "#222222" }}
        >
          <Link
            href="/play/create"
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition-all"
            style={{
              background: "linear-gradient(135deg, #d97706, #f59e0b)",
              color: "#1a0a00",
              boxShadow: "0 0 12px rgba(217,119,6,0.3)",
            }}
          >
            ✦ CREATE TABLE
          </Link>

          <div>
            <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "#52525b" }}>
              Rooms
            </p>
            <div className="space-y-0.5">
              {allRooms.map((r) => (
                <Link
                  key={r.id}
                  href={`/play/${r.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all"
                  style={{
                    background: r.id === room.id ? "rgba(217,119,6,0.1)" : "transparent",
                    borderLeft: r.id === room.id ? "3px solid #d97706" : "3px solid transparent",
                    color: r.id === room.id ? "#f59e0b" : "#71717a",
                    fontWeight: r.id === room.id ? 700 : 500,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        r.status === "playing" ? "bg-amber-400" :
                        r.status === "finished" ? "bg-zinc-600" : "bg-emerald-400"
                      }`}
                    />
                    <span className="truncate">{r.name}</span>
                  </div>
                  <span className="shrink-0 ml-1" style={{ color: "#52525b" }}>
                    {r.current_players}/{r.max_players}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Ranked */}
          <div
            className="rounded-xl border p-3"
            style={{ background: "linear-gradient(135deg, #0f1f13, #111)", borderColor: "#1a4a2a" }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>
              Ranked Season
            </p>
            <p className="font-black text-xs text-white">👑 Champion I</p>
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#222" }}>
              <div
                className="h-1.5 rounded-full"
                style={{ width: "72%", background: "linear-gradient(90deg, #059669, #10b981)" }}
              />
            </div>
            <p className="mt-1 text-[9px]" style={{ color: "#52525b" }}>1,850 / 2,000</p>
          </div>

          <button className="rounded-xl py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
            🏆 Leaderboard
          </button>
          <button className="rounded-xl py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
            🛒 Store
          </button>

          {/* My profile card at bottom */}
          {currentProfile && (
            <div className="mt-auto border-t pt-3" style={{ borderColor: "#222" }}>
              <div className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: "linear-gradient(135deg, #059669, #0d4a2a)", border: "2px solid #10b981" }}>
                  {(currentProfile.full_name ?? currentProfile.display_name ?? "L").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{(currentProfile.full_name ?? currentProfile.display_name ?? "Lion").split(" ")[0]}</p>
                  <p className="text-[10px]" style={{ color: "#f59e0b" }}>{myPlayer?.score ?? 0} pts</p>
                </div>
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black"
                  style={{ background: "linear-gradient(135deg, #d97706, #92400e)", color: "#1a0a00" }}>
                  I
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── CENTER ───────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden min-w-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-6xl mb-4"
                >
                  🎲
                </motion.div>
                <p className="text-sm text-zinc-500">Loading game...</p>
              </div>
            </div>
          ) : gamePhase === "lobby" ? (
            // ── LOBBY ──────────────────────────────────────────────────────
            <div className="flex flex-1 items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg space-y-4"
              >
                {/* Room info card */}
                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{ background: "#111111", borderColor: "#222222" }}
                >
                  <div className="text-5xl mb-3">🦁</div>
                  <h2 className="text-2xl font-black text-white">{room.name}</h2>
                  <p className="text-sm mt-1 text-zinc-500">
                    {MODE_LABELS[gameMode]} · First to {room.points_to_win} wins
                  </p>

                  {room.is_private && room.invite_code && (
                    <div
                      className="mt-4 rounded-xl px-4 py-3 inline-block"
                      style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.3)" }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>
                        Invite Code
                      </p>
                      <p className="text-2xl font-black tracking-[0.3em] text-white">
                        {room.invite_code}
                      </p>
                    </div>
                  )}

                  {/* Seats */}
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((seat) => {
                      const player = allPlayers.find((p) => p.seat === seat);
                      const isMe = player?.profile_id === currentProfile?.id;
                      return (
                        <div
                          key={seat}
                          className="rounded-xl border p-3 text-sm"
                          style={{
                            background: player ? "rgba(16,185,129,0.08)" : "#1a1a1a",
                            borderColor: player ? "rgba(16,185,129,0.3)" : "#2a2a2a",
                          }}
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>
                            Seat {seat}{isMe ? " (You)" : ""}
                          </p>
                          {player ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black"
                                style={{ background: isMe ? "linear-gradient(135deg,#059669,#0d4a2a)" : "#2a2a2a" }}
                              >
                                {player.display_name[0]}
                              </div>
                              <span className="text-xs font-bold text-white truncate">{player.display_name}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-600">Empty</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 space-y-2">
                    {!alreadySeated && session && (
                      <button
                        onClick={handleJoinGame}
                        disabled={actionLoading}
                        className="w-full rounded-xl py-3 text-sm font-black text-white transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                      >
                        {actionLoading ? "Joining..." : "Join Table"}
                      </button>
                    )}

                    {isHost ? (
                      allPlayers.length >= 2 ? (
                        <motion.button
                          onClick={() => handleStartGame()}
                          disabled={actionLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          animate={{ boxShadow: ["0 0 0 0 rgba(217,119,6,0.4)", "0 0 20px rgba(217,119,6,0.3)", "0 0 0 0 rgba(217,119,6,0.4)"] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-full rounded-xl py-3.5 text-base font-black text-white disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#1a0a00" }}
                        >
                          {actionLoading ? "Starting..." : "🚀 START GAME"}
                        </motion.button>
                      ) : (
                        <button
                          onClick={() => handleStartGame()}
                          disabled={actionLoading}
                          className="w-full rounded-xl py-3 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
                          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                        >
                          {actionLoading ? "Starting..." : "Solo / Practice Mode"}
                        </button>
                      )
                    ) : (
                      <div
                        className="w-full rounded-xl py-3 text-sm text-center text-zinc-500"
                        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                      >
                        ⏳ Waiting for host to start...
                      </div>
                    )}
                  </div>
                </div>

                {/* Lobby chat */}
                <div className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#222222" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>
                    Room Chat
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                    {messages.length === 0 && (
                      <p className="text-xs text-zinc-600">No messages yet. Say hi! 🦁</p>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className="text-xs">
                        <span className="font-bold" style={{ color: "#10b981" }}>{m.display_name}:</span>{" "}
                        <span className="text-zinc-300">{m.message}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                      placeholder="Say something..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-xl px-3 py-2 text-xs font-bold text-white"
                      style={{ background: "#10b981" }}
                    >
                      ↑
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>

          ) : gamePhase === "blocked" ? (
            // ── BLOCKED GAME ───────────────────────────────────────────────
            <div className="flex flex-1 items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-full max-w-md rounded-3xl border overflow-hidden"
                style={{ background: "#111111", borderColor: "#222222" }}
              >
                <div className="p-6 border-b" style={{ borderColor: "#222222", background: "rgba(239,68,68,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🚫</span>
                    <div>
                      <h2 className="text-xl font-black text-white">TABLE BLOCKED</h2>
                      <p className="text-sm text-zinc-500">No valid moves remaining for any player</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#52525b" }}>
                    Remaining Pip Count
                  </p>
                  {blockedResults.map((r, i) => (
                    <motion.div
                      key={r.playerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        background: r.isWinner ? "rgba(217,119,6,0.15)" : "#1a1a1a",
                        border: `1px solid ${r.isWinner ? "rgba(217,119,6,0.4)" : "#2a2a2a"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {r.isWinner && <span className="text-lg">👑</span>}
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: r.isWinner ? "linear-gradient(135deg,#d97706,#92400e)" : "#2a2a2a" }}
                        >
                          {r.displayName[0]}
                        </div>
                        <span className="font-bold text-sm text-white">{r.displayName}</span>
                        {r.isWinner && (
                          <span
                            className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(217,119,6,0.3)", color: "#f59e0b" }}
                          >
                            WINNER
                          </span>
                        )}
                      </div>
                      <span
                        className="font-black text-sm"
                        style={{ color: r.isWinner ? "#f59e0b" : "#71717a" }}
                      >
                        {r.remainingPips} pips
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => handleStartGame()}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#1a0a00" }}
                  >
                    {actionLoading ? "Starting..." : "Continue to Next Round"}
                  </button>
                  <Link
                    href="/play"
                    className="rounded-xl px-4 py-3 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  >
                    Leave
                  </Link>
                </div>
              </motion.div>
            </div>

          ) : gamePhase === "seriesOver" ? (
            // ── SERIES OVER ─────────────────────────────────────────────────
            (() => {
              const seriesTarget = room.points_to_win ?? 6;
              const sorted = Object.entries(session?.scores ?? {})
                .sort((a, b) => (b[1] as number) - (a[1] as number));
              const topScore   = (sorted[0]?.[1] as number) ?? 0;
              const runnerScore = (sorted[1]?.[1] as number) ?? 0;
              const isLove     = runnerScore === 0;
              const winnerName = allPlayers.find(p => p.profile_id === sorted[0]?.[0])?.display_name ?? "Winner";
              const iWon       = sorted[0]?.[0] === currentProfile?.id;
              return (
                <div className="flex flex-1 items-center justify-center p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className="w-full max-w-md rounded-3xl border overflow-hidden"
                    style={{ background: "#111111", borderColor: "#222222" }}
                  >
                    {/* Header */}
                    <div className="p-6 text-center border-b" style={{ borderColor: "#222222", background: "rgba(16,185,129,0.05)" }}>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-5xl mb-3"
                      >
                        🏆
                      </motion.div>
                      <h2 className="text-2xl font-black text-white">SERIES OVER!</h2>
                      {isLove ? (
                        <div className="mt-2">
                          <p className="text-lg font-black" style={{ color: "#10b981" }}>
                            {seriesTarget} — LOVE 😤
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">A perfect series. Not a single hand dropped.</p>
                        </div>
                      ) : (
                        <p className="text-3xl font-black mt-2" style={{ color: "#f59e0b" }}>
                          {topScore} — {runnerScore}
                        </p>
                      )}
                      <p className="text-sm text-zinc-400 mt-2">
                        {iWon ? "🦁 You won the series!" : `${winnerName} wins the series`}
                      </p>
                    </div>

                    {/* Scoreboard */}
                    <div className="p-6 space-y-2">
                      {sorted.map(([profileId, score], i) => {
                        const player = allPlayers.find(p => p.profile_id === profileId);
                        const isChamp = i === 0;
                        return (
                          <motion.div
                            key={profileId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{
                              background: isChamp ? "rgba(16,185,129,0.12)" : "#1a1a1a",
                              border: `1px solid ${isChamp ? "rgba(16,185,129,0.4)" : "#2a2a2a"}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span>{isChamp ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                              <div>
                                <p className="font-bold text-sm text-white">
                                  {player?.display_name ?? "Player"}
                                  {profileId === currentProfile?.id ? " (You)" : ""}
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                  {isChamp ? "Series winner" : `${seriesTarget - (score as number)} win${seriesTarget - (score as number) === 1 ? "" : "s"} short`}
                                </p>
                              </div>
                            </div>
                            <span className="font-black text-xl" style={{ color: isChamp ? "#10b981" : "#71717a" }}>
                              {score as number}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-2 flex gap-3">
                      <button
                        onClick={() => { handleStartGame(true); }}
                        disabled={actionLoading || !isHost}
                        className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "white" }}
                      >
                        {actionLoading ? "Dealing…" : isHost ? "🎲 New Series" : "⏳ Waiting for host…"}
                      </button>
                      <Link
                        href="/play"
                        className="rounded-xl px-4 py-3 text-sm font-bold text-zinc-400"
                        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                      >
                        Leave
                      </Link>
                    </div>
                  </motion.div>
                </div>
              );
            })()

          ) : gamePhase === "gameOver" ? (
            // ── HAND OVER (series still in progress) ──────────────────────
            <div className="flex flex-1 items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="w-full max-w-md rounded-3xl border overflow-hidden"
                style={{ background: "#111111", borderColor: "#222222" }}
              >
                <div className="p-6 text-center border-b" style={{ borderColor: "#222222" }}>
                  <div className="text-5xl mb-3">🀱</div>
                  <h2 className="text-2xl font-black text-white">HAND WON</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Series — first to {room.points_to_win ?? 6} wins
                  </p>
                </div>
                <div className="p-6 space-y-2">
                  {Object.entries(session?.scores ?? {})
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([profileId, score], i) => {
                      const player = allPlayers.find((p) => p.profile_id === profileId);
                      const target = room.points_to_win ?? 6;
                      return (
                        <motion.div
                          key={profileId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{
                            background: i === 0 ? "rgba(217,119,6,0.12)" : "#1a1a1a",
                            border: `1px solid ${i === 0 ? "rgba(217,119,6,0.35)" : "#2a2a2a"}`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                            <span className="font-bold text-sm text-white">
                              {player?.display_name ?? "Player"}
                              {profileId === currentProfile?.id ? " (You)" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Mini progress pips */}
                            <div className="flex gap-0.5">
                              {Array.from({ length: target }).map((_, j) => (
                                <div key={j} className="w-2 h-2 rounded-full"
                                  style={{ background: j < (score as number) ? "#f59e0b" : "#2a2a2a" }} />
                              ))}
                            </div>
                            <span className="font-black text-sm w-6 text-right"
                              style={{ color: i === 0 ? "#f59e0b" : "#10b981" }}>
                              {score as number}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
                {/* Auto-restart countdown bar */}
                {autoRestartCount !== null && (
                  <div className="px-6 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">
                        {autoRestartCount > 0 ? "Next hand in…" : "Dealing…"}
                      </span>
                      <span className="text-xs font-black text-amber-400">
                        {autoRestartCount > 0 ? `${autoRestartCount}s` : "🎲"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                        style={{ width: `${(autoRestartCount / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="p-6 pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      if (!isHost) return;
                      if (autoRestartRef.current) {
                        clearInterval(autoRestartRef.current);
                        autoRestartRef.current = null;
                      }
                      setAutoRestartCount(null);
                      handleStartGame();
                    }}
                    disabled={actionLoading || !isHost}
                    className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#1a0a00" }}
                  >
                    {actionLoading ? "Dealing…" : isHost ? "🎲 Deal Now" : "⏳ Waiting for host…"}
                  </button>
                  <Link
                    href="/play"
                    onClick={() => {
                      if (autoRestartRef.current) {
                        clearInterval(autoRestartRef.current);
                        autoRestartRef.current = null;
                      }
                      setAutoRestartCount(null);
                    }}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-zinc-400"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  >
                    Leave
                  </Link>
                </div>
              </motion.div>
            </div>

          ) : (
            // ── PLAYING ────────────────────────────────────────────────────
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Green felt table — also the drop zone for dragged tiles */}
              <div
                className="flex flex-1 flex-col overflow-hidden rounded-3xl m-2 relative"
                style={{
                  background: "radial-gradient(ellipse at center, #0f5c33 0%, #0d4a2a 50%, #0a3520 100%)",
                  border: isDragOver && isMyTurn
                    ? "2px solid rgba(16,185,129,0.8)"
                    : "2px solid rgba(217,119,6,0.25)",
                  boxShadow: isDragOver && isMyTurn
                    ? "0 0 40px rgba(16,185,129,0.3), inset 0 0 80px rgba(0,0,0,0.4)"
                    : "0 0 40px rgba(217,119,6,0.1), inset 0 0 80px rgba(0,0,0,0.4)",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onDragOver={handleBoardDragOver}
                onDragLeave={handleBoardDragLeave}
                onDrop={handleBoardDrop}
              >
                {/* Subtle texture overlay */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.015) 8px, rgba(0,0,0,0.015) 9px)",
                    zIndex: 0,
                  }}
                />

                {/* Lion watermark */}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center select-none z-0"
                  style={{ opacity: 0.05, fontSize: "min(22vw, 200px)", filter: "sepia(1) hue-rotate(80deg)" }}
                >
                  🦁
                </div>

                {/* Drag-over hint overlay */}
                <AnimatePresence>
                  {isDragOver && isMyTurn && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
                      style={{ background: "rgba(16,185,129,0.08)", border: "2px dashed rgba(16,185,129,0.5)" }}
                    >
                      <p className="text-sm font-black text-emerald-400 bg-black/50 rounded-xl px-4 py-2">Drop to play</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Turn indicator */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                  <AnimatePresence mode="wait">
                    {isMyTurn ? (
                      <motion.div
                        key="myturn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="rounded-full px-4 py-1.5 text-xs font-black text-white"
                        style={{
                          background: "linear-gradient(135deg, #059669, #10b981)",
                          boxShadow: "0 0 16px rgba(16,185,129,0.5)",
                        }}
                      >
                        ● YOUR TURN
                      </motion.div>
                    ) : (
                      <motion.div
                        key="theirturn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="rounded-full px-4 py-1.5 text-xs font-bold"
                        style={{ background: "rgba(0,0,0,0.5)", color: "#a1a1aa" }}
                      >
                        {allPlayers.find((p) => p.profile_id === session?.current_turn)?.display_name ?? "..."}&apos;s Turn
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Boneyard */}
                <div className="absolute top-3 right-3 z-10">
                  <div
                    className="rounded-xl px-3 py-2 flex items-center gap-2"
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(217,119,6,0.2)" }}
                  >
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                      BONEYARD
                    </span>
                    <span
                      className="text-sm font-black"
                      style={{ color: boneyardEmpty ? "#71717a" : "#10b981" }}
                    >
                      {session?.boneyard?.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* ── Opponent hands pinned to canvas edges (always visible) ── */}

                {/* North opponent — top center */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
                  {renderOpponentHand(opponentTop, "top")}
                </div>

                {/* West opponent — left center */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  {renderOpponentHand(opponentLeft, "left")}
                </div>

                {/* East opponent — right center */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  {renderOpponentHand(opponentRight, "right")}
                </div>

                {/* Board chain — full middle, padded so it doesn't clash with pinned opponents */}
                <div className="flex flex-1 flex-col items-center justify-center overflow-hidden z-10 relative px-24 pt-16 pb-2 gap-1">
                  {/* Caribbean arm-constraint notice */}
                  {leftRightBlocked && isMyTurn && (
                    <div
                      className="shrink-0 rounded-lg px-3 py-1 text-[10px] font-black text-center"
                      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}
                    >
                      ☝️ Play top &amp; bottom arms first
                    </div>
                  )}
                  {renderBoard()}
                </div>

                {/* My player area */}
                <div className="z-10 relative pb-2 px-3">
                  {/* My info */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {currentProfile && (
                      <PlayerAvatar
                        name={currentProfile.full_name ?? currentProfile.display_name ?? "Lion"}
                        score={myPlayer?.score ?? 0}
                        isActive={isMyTurn}
                        tileCount={myHand.length}
                        isMe
                        size={26}
                      />
                    )}
                  </div>

                  {/* End choice buttons */}
                  <AnimatePresence>
                    {showEndChoices && selectedTile !== null && Array.isArray(selectedPlayEnds) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex flex-wrap justify-center gap-2 mb-2"
                      >
                        {selectedPlayEnds.includes("left") && (
                          <button onClick={() => { handlePlayTile("left"); setShowEndChoices(false); }}
                            className="rounded-xl px-4 py-2 text-sm font-black text-white transition-all hover:scale-105"
                            style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)" }}>
                            ← Left
                          </button>
                        )}
                        {selectedPlayEnds.includes("top") && (
                          <button onClick={() => { handlePlayTile("top"); setShowEndChoices(false); }}
                            className="rounded-xl px-4 py-2 text-sm font-black text-white transition-all hover:scale-105"
                            style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)" }}>
                            ↑ Top
                          </button>
                        )}
                        {selectedPlayEnds.includes("bottom") && (
                          <button onClick={() => { handlePlayTile("bottom"); setShowEndChoices(false); }}
                            className="rounded-xl px-4 py-2 text-sm font-black text-white transition-all hover:scale-105"
                            style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)" }}>
                            ↓ Bottom
                          </button>
                        )}
                        {selectedPlayEnds.includes("right") && (
                          <button onClick={() => { handlePlayTile("right"); setShowEndChoices(false); }}
                            className="rounded-xl px-4 py-2 text-sm font-black text-white transition-all hover:scale-105"
                            style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)" }}>
                            Right →
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hand */}
                  <div
                    className="flex items-end justify-center gap-1 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {myHand.length === 0 ? (
                      <motion.button
                        onClick={() => handleStartGame()}
                        disabled={actionLoading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 text-xs font-black disabled:opacity-50"
                        style={{
                          background: "rgba(16,185,129,0.15)",
                          border: "2px dashed rgba(16,185,129,0.5)",
                          color: "#10b981",
                        }}
                      >
                        <span className="text-xl">🀱</span>
                        {actionLoading ? "Dealing..." : "Deal Tiles"}
                      </motion.button>
                    ) : (
                      myHand.map((tile, i) => (
                        <DominoTileComponent
                          key={i}
                          tile={tile}
                          horizontal
                          size={36}
                          selected={selectedTile === i}
                          playable={isMyTurn && playable[i] && selectedTile !== i}
                          dimmed={isMyTurn && !playable[i]}
                          isDragging={draggedTileIdx === i}
                          onClick={() => handleTileClick(i)}
                          onDoubleClick={() => handleDoubleClickTile(i)}
                          draggable={isMyTurn}
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragEnd={handleDragEnd}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Controls bar ────────────────────────────────────────── */}
              <div
                className="shrink-0 flex items-center justify-between gap-2 border-t px-4 py-2"
                style={{ borderColor: "#1a1a1a", background: "#0a0a0a" }}
              >
                {/* Left: Play tile button */}
                <div className="flex items-center gap-2 min-w-[120px]">
                  {selectedTile !== null && isMyTurn && canPlayAny && !showEndChoices && (
                    <>
                      {needsChoice ? (
                        <button
                          onClick={() => setShowEndChoices(true)}
                          disabled={actionLoading}
                          className="rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-40 flex items-center gap-1.5"
                          style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}
                        >
                          ⚡ Choose End
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePlayTile("auto")}
                          disabled={actionLoading}
                          className="rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-40 flex items-center gap-1.5"
                          style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}
                        >
                          ⚡ Play Tile
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Center: Knock / Sort */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePass}
                    disabled={!isMyTurn || hasPlayable || actionLoading}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: isMyTurn && !hasPlayable ? "rgba(239,68,68,0.12)" : "#111",
                      border: `1.5px solid ${isMyTurn && !hasPlayable ? "rgba(239,68,68,0.5)" : "#2a2a2a"}`,
                      color: isMyTurn && !hasPlayable ? "#ef4444" : "#444",
                      boxShadow: isMyTurn && !hasPlayable ? "0 0 12px rgba(239,68,68,0.15)" : "none",
                    }}
                  >
                    <span>🤜</span> KNOCK
                  </button>
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all"
                    style={{
                      background: "linear-gradient(135deg, #059669, #047857)",
                      color: "white",
                      boxShadow: "0 0 12px rgba(16,185,129,0.2)",
                      border: "1.5px solid rgba(16,185,129,0.4)"
                    }}
                  >
                    <span>↕</span> SORT
                  </button>
                </div>

                {/* Right: spacer */}
                <div className="min-w-[120px]" />
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex w-72 shrink-0 flex-col border-l"
          style={{ background: "#111111", borderColor: "#222222" }}
        >
          {/* Tab bar */}
          <div className="flex border-b shrink-0" style={{ borderColor: "#222222" }}>
            {(["chat", "players"] as ChatTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setChatTab(tab)}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors"
                style={{
                  borderBottom: chatTab === tab ? "2px solid #10b981" : "2px solid transparent",
                  color: chatTab === tab ? "#10b981" : "#52525b",
                }}
              >
                {tab === "chat" ? "CHAT" : `PLAYERS (${allPlayers.length})`}
              </button>
            ))}
          </div>

          {chatTab === "chat" ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <p className="text-xs text-center text-zinc-600 pt-4">
                    No messages yet. Say hi! 🦁
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black mt-0.5"
                      style={{ background: "linear-gradient(135deg, #059669, #0d4a2a)" }}>
                      {m.display_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-black" style={{ color: "#10b981" }}>{m.display_name}</span>
                        <span className="text-zinc-600 text-[9px]">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">{m.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input + quick chat */}
              <div className="shrink-0 border-t p-3 space-y-3" style={{ borderColor: "#222222" }}>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                    placeholder="Message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-xl px-3 py-2 text-xs font-black text-white"
                    style={{ background: "#10b981" }}
                  >
                    ↑
                  </button>
                </form>

                {/* Quick chat */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "#52525b" }}>
                    Quick Chat
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {QUICK_CHATS.map((qc) => (
                      <button
                        key={qc}
                        onClick={() => sendMessage(qc)}
                        className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid rgba(217,119,6,0.2)",
                          color: "#a1a1aa",
                        }}
                      >
                        {qc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice chat */}
                <button
                  className="w-full rounded-xl py-2.5 text-xs font-black transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#10b981",
                  }}
                >
                  🎤 VOICE CHAT
                </button>

                {/* Spectators */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>
                    👁 Spectators ({room.spectator_count ?? 0})
                  </p>
                  <p className="text-[10px] text-zinc-600">No spectators watching</p>
                </div>
              </div>
            </>
          ) : (
            /* Players tab */
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>
                Seated Players
              </p>
              {[0, 1, 2, 3].map((seat) => {
                const player = allPlayers.find((p) => p.seat === seat);
                const isCurrentTurn = player?.profile_id === session?.current_turn;
                const isMe = player?.profile_id === currentProfile?.id;
                return (
                  <div
                    key={seat}
                    className="rounded-xl border p-3 transition-all"
                    style={{
                      background: isCurrentTurn && gamePhase === "playing"
                        ? "rgba(16,185,129,0.08)"
                        : player ? "#1a1a1a" : "rgba(26,26,26,0.4)",
                      borderColor: isCurrentTurn && gamePhase === "playing"
                        ? "rgba(16,185,129,0.3)"
                        : "#2a2a2a",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-black"
                        style={{
                          background: player
                            ? isMe
                              ? "linear-gradient(135deg, #059669, #0d4a2a)"
                              : "linear-gradient(135deg, #2a2a2a, #1a1a1a)"
                            : "#1a1a1a",
                          border: isCurrentTurn && gamePhase === "playing"
                            ? "2px solid #10b981"
                            : "2px solid #2a2a2a",
                        }}
                      >
                        {player ? player.display_name[0] : "·"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {player
                            ? player.display_name + (isMe ? " (You)" : "")
                            : `Seat ${seat} — Empty`}
                        </p>
                        {player && (
                          <p className="text-[10px]" style={{ color: "#52525b" }}>
                            {player.tile_count ?? player.hand?.length ?? 0} tiles remaining
                          </p>
                        )}
                      </div>
                      {player && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black" style={{ color: "#10b981" }}>
                            {player.score ?? 0}
                          </span>
                          <span className="text-[9px]" style={{ color: "#52525b" }}>pts</span>
                        </div>
                      )}
                    </div>
                    {isCurrentTurn && gamePhase === "playing" && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: "#10b981" }}
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        />
                        <p className="text-[9px] font-bold" style={{ color: "#10b981" }}>
                          Playing now
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Scores */}
              {session && Object.keys(session.scores ?? {}).length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#222222" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>
                    Game Scores
                  </p>
                  <div className="space-y-2">
                    {Object.entries(session.scores)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([profileId, score], i) => {
                        const player = allPlayers.find((p) => p.profile_id === profileId);
                        return (
                          <div key={profileId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-600">{i + 1}.</span>
                              <span className="text-zinc-400 truncate">
                                {player?.display_name ?? "Player"}
                              </span>
                            </div>
                            <span className="font-black" style={{ color: "#10b981" }}>
                              {score as number} pts
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Teams display */}
              {gameMode === "teams" && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#222222" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>
                    Teams
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Team A", seats: [0, 2], color: "#10b981" },
                      { label: "Team B", seats: [1, 3], color: "#a855f7" },
                    ].map((team) => (
                      <div
                        key={team.label}
                        className="rounded-xl px-3 py-2"
                        style={{ background: `${team.color}15`, border: `1px solid ${team.color}33` }}
                      >
                        <p className="text-[10px] font-black mb-1" style={{ color: team.color }}>
                          {team.label}
                        </p>
                        <div className="flex gap-2">
                          {team.seats.map((seat) => {
                            const p = allPlayers.find((pl) => pl.seat === seat);
                            return (
                              <span key={seat} className="text-xs text-zinc-400">
                                {p?.display_name ?? `Seat ${seat}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
