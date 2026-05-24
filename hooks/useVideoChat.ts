"use client";

/**
 * useVideoChat — WebRTC peer-to-peer video chat for a game room.
 *
 * Mirrors useVoiceChat but carries video tracks only (audio = false).
 * Keeps voice and video as independent connections so players can use
 * either or both independently.
 *
 * Signaling uses a dedicated Supabase Realtime broadcast channel
 * `video-{roomId}` separate from the voice and game channels.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface RemoteVideoStream {
  peerId: string;
  stream: MediaStream;
  displayName: string;
}

export function useVideoChat(roomId: string, myId: string | null, displayName?: string) {
  const supabase = createClient();

  const [active, setActive]               = useState(false);
  const [cameraOff, setCameraOff]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams]  = useState<RemoteVideoStream[]>([]);
  const [localStream, setLocalStream]     = useState<MediaStream | null>(null);

  const localStreamRef  = useRef<MediaStream | null>(null);
  const pcsRef          = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef      = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeRef       = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const broadcast = useCallback((payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event: "video", payload });
  }, []);

  const removeRemote = useCallback((peerId: string) => {
    pcsRef.current.get(peerId)?.close();
    pcsRef.current.delete(peerId);
    setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
  }, []);

  const createPc = useCallback((peerId: string, peerName: string): RTCPeerConnection => {
    if (pcsRef.current.has(peerId)) {
      pcsRef.current.get(peerId)!.close();
      pcsRef.current.delete(peerId);
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcsRef.current.set(peerId, pc);

    // Add local video track
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Receive remote video
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      setRemoteStreams(prev => {
        const without = prev.filter(s => s.peerId !== peerId);
        return [...without, { peerId, stream, displayName: peerName }];
      });
    };

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate && myId) {
        broadcast({ type: "ice", from: myId, to: peerId, candidate: e.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        removeRemote(peerId);
      }
    };

    return pc;
  }, [myId, broadcast, removeRemote]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const join = useCallback(async () => {
    if (!myId || activeRef.current) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
        audio: false, // audio handled separately by useVoiceChat
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      activeRef.current = true;
      setActive(true);
      broadcast({ type: "join", from: myId, name: displayName ?? myId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Camera access denied. Allow it in your browser settings."
          : "Could not access camera."
      );
    }
  }, [myId, broadcast]);

  const leave = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    pcsRef.current.forEach((_, id) => removeRemote(id));
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams([]);
    setActive(false);
    setCameraOff(false);
    if (myId) broadcast({ type: "leave", from: myId });
  }, [myId, broadcast, removeRemote]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nowOff = !cameraOff;
    stream.getVideoTracks().forEach(t => { t.enabled = !nowOff; });
    setCameraOff(nowOff);
  }, [cameraOff]);

  // ── Signaling ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!myId) return;

    const channel = supabase.channel(`video-${roomId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "video" }, async ({ payload }: { payload: Record<string, unknown> }) => {
      if (!payload || !activeRef.current) return;

      const to = payload.to as string | undefined;
      if (to && to !== myId) return;

      const from     = payload.from as string;
      const fromName = (payload.name as string | undefined) ?? from;
      const type     = payload.type as string;
      if (!from || from === myId) return;

      if (type === "join") {
        // Existing participant initiates offer to newcomer
        const pc = createPc(from, fromName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        broadcast({ type: "offer", from: myId, to: from, sdp: pc.localDescription, name: displayName ?? myId });

      } else if (type === "offer") {
        const existing = pcsRef.current.get(from);
        if (existing && existing.signalingState !== "stable") {
          if (myId > from) return;
          existing.close();
          pcsRef.current.delete(from);
        }
        const pc = createPc(from, fromName);
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
          } catch { /* ICE arrived before remote desc — safe to ignore */ }
        }

      } else if (type === "leave") {
        removeRemote(from);
      }
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId]);

  useEffect(() => { return () => { leave(); }; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return { active, cameraOff, error, localStream, remoteStreams, join, leave, toggleCamera };
}
