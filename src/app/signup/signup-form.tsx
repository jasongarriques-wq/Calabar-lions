"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  { value: "student", label: "Current Calabar student" },
  { value: "alumni", label: "Alumnus (Old Boy)" },
  { value: "parent", label: "Parent / guardian" },
  { value: "teacher", label: "Teacher / staff" },
];

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const data = new FormData(e.currentTarget);
    const supabase = createClient();
    const email = String(data.get("email") ?? "");
    const { error } = await supabase.auth.signUp({
      email,
      password: String(data.get("password") ?? ""),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: String(data.get("full_name") ?? ""),
          role: String(data.get("role") ?? "student"),
        },
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage(
      `Almost done — we sent a confirmation link to ${email}. Open it to activate your account.`,
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="full_name" className="label">Full name</label>
        <input id="full_name" name="full_name" required className="input" />
      </div>
      <div>
        <label htmlFor="role" className="label">I am a…</label>
        <select id="role" name="role" required className="input" defaultValue="student">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="input"
        />
        <p className="mt-1 text-xs text-stone-500">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-calabar-green-700">{message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
