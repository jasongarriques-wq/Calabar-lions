"use client";

import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  /** Mirror the video (looks natural for self-view) */
  mirror?: boolean;
  /** Mute the element — always true for self-view to avoid echo */
  muted?: boolean;
  /** Camera-off overlay */
  cameraOff?: boolean;
  size?: "sm" | "md";
}

export default function VideoTile({
  stream,
  label,
  mirror = false,
  muted  = false,
  cameraOff = false,
  size = "md",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  const h = size === "sm" ? 60 : 90;

  return (
    <div
      className="relative rounded-xl overflow-hidden shrink-0"
      style={{ aspectRatio: "16/9", height: h, background: "#111" }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: mirror ? "scaleX(-1)" : "none",
          display: cameraOff ? "none" : "block",
        }}
      />

      {/* Camera-off placeholder */}
      {cameraOff && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "#1a1a1a" }}
        >
          <span style={{ fontSize: 22 }}>📷</span>
        </div>
      )}

      {/* Name label */}
      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <p className="text-[9px] font-black text-white truncate">{label}</p>
      </div>
    </div>
  );
}
