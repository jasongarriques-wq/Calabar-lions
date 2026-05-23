"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinGroupButton({
  groupId,
  initialIsMember,
}: {
  groupId: string;
  initialIsMember: boolean;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in first.");
      setPending(false);
      return;
    }

    if (isMember) {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (error) setError(error.message);
      else setIsMember(false);
    } else {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id });
      if (error) setError(error.message);
      else setIsMember(true);
    }
    setPending(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={isMember ? "btn-secondary" : "btn-primary"}
      >
        {pending ? "…" : isMember ? "Leave group" : "Join group"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
