"use client";

/**
 * useVoiceChat — WebRTC peer-to-peer voice chat for a game room.
 *
 * Signaling uses Supabase Realtime broadcast (no extra service needed).
 * Audio is direct peer-to-peer via the browser's WebRTC stack.
 *
 * Flow:
 *   join()  → asks for mic → broadcasts "join" → existing peers send offers
 *   offer   → newcomer answers → ICE exchanged → audio flows
 *   leave() → closes all PCs → stops mic → broadcasts "leave"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface VoicePeer {
  id: string;
  speaking: boolean;
}

export function useVoiceChat(roomId: string, myId: string | null, displayName?: string) {
  const supabase = createClient();

  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef        = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef   = useRef<Map<string, HTMLAudioElement>>(new Map());
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeRef     = useRef(false); // sync ref so callbacks always see latest

  // ── Helpers ────────────────────────────────────────────────────────────────

  const broadcast = useCallback((payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event: "voice", payload });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    pcsRef.current.get(peerId)?.close();
    pcsRef.current.delete(peerId);
    const audio = audioElsRef.current.get(peerId);
    if (audio) { audio.srcObject = null; audioElsRef.current.delete(peerId); }
    setConnectedPeers(prev => prev.filter(id => id !== peerId));
    setPeerNames(prev => { const n = { ...prev }; delete n[peerId]; return n; });
  }, []);

  const createPc = useCallback((peerId: string): RTCPeerConnection => {
    // Close any stale connection first
    if (pcsRef.current.has(peerId)) {
      pcsRef.current.get(peerId)!.close();
      pcsRef.current.delete(peerId);
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcsRef.current.set(peerId, pc);

    // Attach local mic tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Play remote audio
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      let audio = audioElsRef.current.get(peerId);
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audioElsRef.current.set(peerId, audio);
      }
      audio.srcObject = stream;
    };

    // Forward ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && myId) {
        broadcast({ type: "ice", from: myId, to: peerId, candidate: e.candidate.toJSON() });
      }
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setConnectedPeers(prev => prev.includes(peerId) ? prev : [...prev, peerId]);
      } else if (state === "failed" || state === "closed") {
        removePeer(peerId);
      }
    };

    return pc;
  }, [myId, broadcast, removePeer]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const join = useCallback(async () => {
    if (!myId || activeRef.current) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      activeRef.current = true;
      setActive(true);
      // Tell all other voice participants I'm here; they'll send offers
      broadcast({ type: "join", from: myId, name: displayName ?? myId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Microphone access denied. Allow it in your browser settings."
          : "Could not access microphone."
      );
    }
  }, [myId, broadcast]);

  const leave = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    // Close all peer connections
    pcsRef.current.forEach((_, id) => removePeer(id));
    // Stop mic
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setActive(false);
    setMuted(false);
    setConnectedPeers([]);
    if (myId) broadcast({ type: "leave", from: myId });
  }, [myId, broadcast, removePeer]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nowMuted = !muted;
    stream.getAudioTracks().forEach(t => { t.enabled = !nowMuted; });
    setMuted(nowMuted);
  }, [muted]);

  // ── Signaling via Supabase broadcast ──────────────────────────────────────

  useEffect(() => {
    if (!myId) return;

    const channel = supabase.channel(`voice-${roomId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "voice" }, async ({ payload }: { payload: Record<string, unknown> }) => {
      if (!payload || !activeRef.current) return;

      // Drop messages not addressed to me (except "join" and "leave" which are global)
      const to = payload.to as string | undefined;
      if (to && to !== myId) return;

      const from     = payload.from as string;
      const fromName = (payload.name as string | undefined) ?? from;
      const type     = payload.type as string;
      if (!from || from === myId) return;

      if (type === "join") {
        // Track the joining peer's display name
        setPeerNames(prev => ({ ...prev, [from]: fromName }));
        // Existing participant → send offer to the newcomer (include own name)
        const pc = createPc(from);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        broadcast({ type: "offer", from: myId, to: from, sdp: pc.localDescription, name: displayName ?? myId });

      } else if (type === "offer") {
        // Track the offering peer's display name
        setPeerNames(prev => ({ ...prev, [from]: fromName }));
        // Glare guard: ignore incoming offer if we already have a stable connection
        const existing = pcsRef.current.get(from);
        if (existing && existing.signalingState !== "stable") {
          // Resolve glare by seat: higher ID wins (arbitrary but deterministic)
          if (myId > from) return;
          existing.close();
          pcsRef.current.delete(from);
        }
        const pc = createPc(from);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        broadcast({ type: "answer", from: myId, to: from, sdp: pc.localDescription });

      } else if (type === "answer") {
        const pc = pcsRef.current.get(from);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit));
        }

      } else if (type === "ice") {
        const pc = pcsRef.current.get(from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate as RTCIceCandidateInit));
          } catch {
            // ICE candidate arrived before remote desc — safe to ignore
          }
        }

      } else if (type === "leave") {
        removePeer(from);
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { leave(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { active, muted, error, connectedPeers, peerNames, join, leave, toggleMute };
}
