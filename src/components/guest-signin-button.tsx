"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GuestSignInButton({
  className,
  next = "/dashboard",
}: {
  className?: string;
  next?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    setPending(false);
    if (error) {
      setError(
        error.message.includes("disabled") || error.message.includes("not enabled")
          ? "Guest access isn't enabled yet. Ask an admin to turn on Anonymous Sign-ins in Supabase."
          : error.message,
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn-secondary w-full disabled:opacity-60"
      >
        {pending ? "Setting up your guest pass…" : "Continue as guest"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-stone-500">
        Browse the site without an account. You can convert to a full account later.
      </p>
    </div>
  );
}
