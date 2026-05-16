"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GuestUpgradeBanner() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const data = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      email: String(data.get("email") ?? ""),
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage(
      "Check your email — confirm the link to keep your progress on a permanent account.",
    );
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-2xl border border-calabar-gold-200 bg-calabar-gold-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-calabar-gold-800">You&rsquo;re browsing as a guest.</p>
          <p className="mt-1 text-sm text-calabar-gold-800/80">
            Add your email to save your dashboard, SBA progress, and groups permanently.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-wrap gap-2 sm:w-auto">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="input min-w-0 flex-1 sm:w-64"
          />
          <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
            {pending ? "Sending…" : "Claim account"}
          </button>
        </form>
      </div>
      {message && <p className="mt-3 text-sm text-calabar-green-800">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
