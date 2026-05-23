"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Guest quick-signup modal
  const [showGuest, setShowGuest]       = useState(false);
  const [gName, setGName]               = useState("");
  const [gEmail, setGEmail]             = useState("");
  const [gPassword, setGPassword]       = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError]     = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleGuestSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!gName.trim())  { setGuestError("Please enter your name."); return; }
    if (!gEmail.trim()) { setGuestError("Please enter your email."); return; }
    if (gPassword.length < 6) { setGuestError("Password must be at least 6 characters."); return; }

    setGuestLoading(true); setGuestError("");

    const { data, error: signupErr } = await supabase.auth.signUp({
      email: gEmail.trim(),
      password: gPassword,
      options: { data: { full_name: gName.trim(), role: "student" } },
    });

    if (signupErr) { setGuestError(signupErr.message); setGuestLoading(false); return; }

    const userId = data?.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: gName.trim(),
        display_name: gName.trim(),
        role: "student",
        approved: true,
      }, { onConflict: "id", ignoreDuplicates: true });
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl">🦁</Link>
          <h1 className="mt-3 text-2xl font-black">Welcome back, Lion</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your Calabar Lions account</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {error && (
            <div className="rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@school.edu.jm"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-50">
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Guest quick signup */}
          <button type="button" onClick={() => setShowGuest(true)}
            className="w-full rounded-xl border border-amber-700/50 bg-amber-950/20 py-3 text-sm font-bold text-amber-400 hover:border-amber-500 hover:bg-amber-950/40 transition-all flex items-center justify-center gap-2">
            🦁 Quick Guest Sign Up — Full Access
          </button>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-green-400 hover:text-green-300">Join the pride</Link>
          </p>
        </form>
      </div>

      {/* ── Guest quick-signup modal ─────────────────────────────────────── */}
      {showGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">

            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700">
                <span className="text-2xl">🦁</span>
              </div>
              <h2 className="text-lg font-black">Quick Sign Up</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Full access to Lion Tools, Dominos &amp; everything else.
              </p>
            </div>

            <form onSubmit={handleGuestSignup} className="space-y-3">
              {guestError && (
                <div className="rounded-xl bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-300">{guestError}</div>
              )}

              <div>
                <label className="label">Name</label>
                <input className="input" placeholder="Marcus Williams"
                  value={gName} onChange={e => setGName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={gEmail} onChange={e => setGEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters"
                  value={gPassword} onChange={e => setGPassword(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowGuest(false); setGuestError(""); setGName(""); setGEmail(""); setGPassword(""); }}
                  className="btn-secondary flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={guestLoading}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-black text-white hover:bg-amber-500 transition-colors disabled:opacity-50">
                  {guestLoading ? "Creating…" : "Get Started 🦁"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs text-zinc-600">
              Want your full school profile?{" "}
              <Link href="/signup" className="text-green-400 hover:text-green-300 font-semibold">Full sign up</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
