"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));

    const channel = supabase.channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setUnread(n => n + 1))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  return (
    <Link href="/notifications" className="relative rounded-xl bg-zinc-800 p-2 text-sm hover:bg-zinc-700">
      🔔
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
