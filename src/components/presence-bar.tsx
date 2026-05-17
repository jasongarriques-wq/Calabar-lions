"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Presence = {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
};

export function PresenceBar({
  topic,
  currentUserId,
  currentUserName,
  currentUserRole,
}: {
  topic: string;
  currentUserId: string | null;
  currentUserName: string;
  currentUserRole: string;
}) {
  const [others, setOthers] = useState<Presence[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence:${topic}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Presence>();
        const flat: Presence[] = [];
        for (const [key, metas] of Object.entries(state)) {
          if (key === currentUserId) continue;
          const meta = metas[0];
          if (meta) flat.push(meta);
        }
        setOthers(flat);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            name: currentUserName,
            role: currentUserRole,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topic, currentUserId, currentUserName, currentUserRole]);

  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {others.slice(0, 5).map((p) => (
          <Avatar key={p.user_id} name={p.name} role={p.role} />
        ))}
      </div>
      <span className="text-xs text-stone-500">
        {others.length === 1
          ? `${others[0].name} is viewing`
          : `${others.length} others viewing`}
      </span>
    </div>
  );
}

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isStaff = role === "teacher" || role === "admin";
  return (
    <span
      title={`${name} (${role})`}
      className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white ${
        isStaff ? "bg-calabar-gold-600" : "bg-calabar-green-700"
      }`}
    >
      {initials}
    </span>
  );
}
