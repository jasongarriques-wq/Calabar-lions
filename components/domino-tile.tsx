"use client";

import { motion } from "framer-motion";

type DominoTile = [number, number];

interface DominoTileProps {
  tile: DominoTile;
  horizontal?: boolean;
  size?: number;
  selected?: boolean;
  playable?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  facedown?: boolean;
  justPlaced?: boolean;
  dimmed?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

// Standard domino pip positions on a 3×3 grid [row, col], each 0–2
const PIP_POSITIONS: [number, number][][] = [
  [],                                                                           // 0
  [[1, 1]],                                                                     // 1
  [[0, 0], [2, 2]],                                                             // 2
  [[0, 0], [1, 1], [2, 2]],                                                     // 3
  [[0, 0], [0, 2], [2, 0], [2, 2]],                                             // 4
  [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],                                    // 5
  [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],                           // 6
  [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 2]],                   // 7
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]],           // 8
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],  // 9
];

/**
 * Renders one half of a domino tile with correct pip placement.
 * `size` = pixel width & height of this square half.
 */
function PipFace({ value, size }: { value: number; size: number }) {
  const pips = PIP_POSITIONS[Math.min(value, 9)] ?? [];
  const pad = Math.max(3, size * 0.17);        // inner margin
  const usable = size - pad * 2;               // space pips live in
  const pipR = Math.max(2, size * 0.1);        // pip radius

  // Three evenly-spaced anchor positions: top/left, center, bottom/right
  const spot = (i: number) => pad + (i / 2) * usable;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        // Subtle inner shadow so each half feels recessed like real ivory
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
        borderRadius: 2,
      }}
    >
      {pips.map(([row, col], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: pipR * 2,
            height: pipR * 2,
            borderRadius: "50%",
            // Deep drilled-in pip look
            background: "radial-gradient(circle at 35% 30%, #333, #000)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.6)",
            top: spot(row) - pipR,
            left: spot(col) - pipR,
          }}
        />
      ))}
    </div>
  );
}

export default function DominoTileComponent({
  tile,
  horizontal = true,
  size = 52,
  selected = false,
  playable = false,
  onClick,
  onDoubleClick,
  facedown = false,
  justPlaced = false,
  dimmed = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: DominoTileProps) {
  // `size` = each half square. Divider is a thin scored groove.
  const half = size;
  const groove = Math.max(1, Math.round(size * 0.05));   // center divider thickness
  const radius = Math.max(3, Math.round(size * 0.1));    // tile corner radius
  const border = 1.5;                                    // outer border

  // Outer tile dimensions
  const tileW = horizontal ? half * 2 + groove : half;
  const tileH = horizontal ? half : half * 2 + groove;

  // ── Face-down tile ───────────────────────────────────────────────────────────
  if (facedown) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: tileW,
          height: tileH,
          borderRadius: radius,
          // Solid near-black back — clearly visible on the green felt
          background: "linear-gradient(145deg, #111111, #0a0a0a)",
          border: `${border}px solid rgba(255,255,255,0.18)`,
          boxShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
          opacity: dimmed ? 0.35 : 1,
          flexShrink: 0,
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={onClick}
      >
        <span
          style={{
            fontSize: Math.round(size * 0.35),
            opacity: 0.18,
            filter: "sepia(1) hue-rotate(80deg)",
          }}
        >
          🦁
        </span>
      </div>
    );
  }

  // ── Face-up tile body ────────────────────────────────────────────────────────
  const tileStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: horizontal ? "row" : "column",
    alignItems: "stretch",
    justifyContent: "center",
    width: tileW,
    height: tileH,
    borderRadius: radius,
    flexShrink: 0,
    cursor: onClick ? "pointer" : "default",
    userSelect: "none",
    position: "relative",
    // Classic ivory/bone domino face
    background: selected
      ? "linear-gradient(145deg, #ffffff, #f5f0e4, #ede4cc)"
      : "linear-gradient(145deg, #f9f5ec, #f0e9d8, #e8dfc8)",
    border: selected
      ? `${border}px solid #10b981`
      : playable
      ? `${border}px solid rgba(16,185,129,0.65)`
      : `${border}px solid #2a2218`,
    boxShadow: selected
      ? "0 -8px 20px rgba(16,185,129,0.45), 0 0 0 2px rgba(16,185,129,0.2), 0 4px 12px rgba(0,0,0,0.6)"
      : playable
      ? "0 0 14px rgba(16,185,129,0.35), 0 3px 8px rgba(0,0,0,0.5)"
      : "0 3px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.7)",
    transform: selected
      ? "translateY(-10px) scale(1.07)"
      : isDragging
      ? "scale(1.08) rotate(2deg)"
      : "none",
    opacity: isDragging ? 0.6 : dimmed ? 0.35 : 1,
    transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
    overflow: "hidden",
  };

  // Center groove (scored dividing line like a real domino)
  const grooveStyle: React.CSSProperties = horizontal
    ? {
        width: groove,
        alignSelf: "stretch",
        flexShrink: 0,
        background: "linear-gradient(to bottom, #c8b88a, #a08050, #c8b88a)",
      }
    : {
        height: groove,
        alignSelf: "stretch",
        flexShrink: 0,
        background: "linear-gradient(to right, #c8b88a, #a08050, #c8b88a)",
      };

  const TileContent = (
    <div
      style={tileStyle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${tile[0]}-${tile[1]}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Playable pulse ring */}
      {playable && !selected && (
        <motion.div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: radius + 2,
            border: "1.5px solid rgba(16,185,129,0.55)",
            pointerEvents: "none",
            zIndex: 1,
          }}
          animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
      )}

      {/* Left / top pip face */}
      <PipFace value={tile[0]} size={half} />

      {/* Scored center groove */}
      <div style={grooveStyle} />

      {/* Right / bottom pip face */}
      <PipFace value={tile[1]} size={half} />
    </div>
  );

  if (justPlaced) {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {TileContent}
      </motion.div>
    );
  }

  return TileContent;
}
