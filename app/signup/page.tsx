"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

const roles: { value: Role; label: string; icon: string }[] = [
  { value: "student",  label: "Student",          icon: "📓" },
  { value: "teacher",  label: "Teacher / Tutor",  icon: "🏫" },
  { value: "alumni",   label: "Alumni",            icon: "🎓" },
  { value: "parent",   label: "Parent / Guardian", icon: "👨‍👩‍👧" },
];

const forms = ["1", "2", "3", "4", "5", "6L", "6U"];

/** Convert raw Supabase auth error messages into student-friendly text. */
function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("invalid email") || m.includes("unable to validate"))
    return "Please enter a valid email address.";
  if (m.includes("password") && (m.includes("characters") || m.includes("weak") || m.includes("short")))
    return "Password must be at least 8 characters long.";
  if (m.includes("email not confirmed"))
    return "Please check your email and click the confirmation link first.";
  if (m.includes("database error") || m.includes("unexpected") || m.includes("internal"))
    return "Account creation failed — please try again. If this keeps happening, contact support.";
  return msg; // Supabase's own validation messages are usually fine as-is
}

/** Upsert the user's profile, making sure approved = true.
 *  The trigger sets approved = true, but we upsert anyway as a safety net
 *  (covers the rare case where the trigger ran before our columns existed). */
async function ensureProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  data: { full_name: string; role: string; form?: string; bio?: string },
) {
  // Try an update first (profile likely already exists from trigger)
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      full_name:    data.full_name || null,
      display_name: data.full_name || null,
      role:         data.role,
      form:         data.form || null,
      bio:          data.bio  || null,
      approved:     true,
    })
    .eq("id", userId);

  if (updateErr) {
    // Profile didn't exist yet — insert it
    await supabase.from("profiles").upsert(
      {
        id:           userId,
        full_name:    data.full_name || null,
        display_name: data.full_name || null,
        role:         data.role,
        form:         data.form || null,
        bio:          data.bio  || null,
        approved:     true,
      },
      { onConflict: "id" },    // ignoreDuplicates NOT used → always updates
    );
  }
}

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();

  // Full signup
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm]     = useState({
    email: "", password: "", fullName: "",
    role: "student" as Role, studentForm: "", bio: "",
  });
  function update(key: string, value: string) { setForm(p => ({ ...p, [key]: value })); }

  // Guest quick-signup
  const [showGuest, setShowGuest]       = useState(false);
  const [gName, setGName]               = useState("");
  const [gEmail, setGEmail]             = useState("");
  const [gPassword, setGPassword]       = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError]     = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name:    form.fullName,
          role:         form.role,
          form:         form.studentForm || null,
          bio:          form.bio || null,
        },
      },
    });

    if (signupError) {
      setError(friendlyAuthError(signupError.message));
      setLoading(false);
      return;
    }

    const userId = authData?.user?.id;
    if (userId) {
      await ensureProfile(supabase, userId, {
        full_name: form.fullName,
        role:      form.role,
        form:      form.studentForm,
        bio:       form.bio,
      });
    }

    router.push("/dashboard");
  }

  async function handleGuestSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!gName.trim())       { setGuestError("Please enter your name."); return; }
    if (!gEmail.trim())      { setGuestError("Please enter your email address."); return; }
    if (gPassword.length < 6) { setGuestError("Password must be at least 6 characters."); return; }

    setGuestLoading(true); setGuestError("");

    const { data, error: signupErr } = await supabase.auth.signUp({
      email:    gEmail.trim(),
      password: gPassword,
      options:  { data: { full_name: gName.trim(), role: "student" } },
    });

    if (signupErr) {
      setGuestError(friendlyAuthError(signupErr.message));
      setGuestLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      await ensureProfile(supabase, userId, {
        full_name: gName.trim(),
        role:      "student",
      });
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl">🦁</Link>
          <h1 className="mt-3 text-2xl font-black">Join the pride</h1>
          <p className="mt-1 text-sm text-zinc-500">Create your Calabar Lions profile</p>
        </div>

        {/* Two options */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowGuest(true)}
            className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-4 text-left hover:border-amber-500 hover:bg-amber-950/40 transition-all"
          >
            <span className="text-2xl mb-2 block">👤</span>
            <p className="font-black text-amber-400 text-sm">Visitor</p>
            <p className="text-xs text-zinc-500 mt-0.5">Profile &amp; Lion Tools access</p>
          </button>
          <button
            onClick={() => { setShowGuest(false); setStep(1); }}
            className="rounded-2xl border border-green-700/50 bg-green-950/20 p-4 text-left hover:border-green-500 hover:bg-green-950/40 transition-all"
          >
            <span className="text-2xl mb-2 block">🎓</span>
            <p className="font-black text-green-400 text-sm">Full Profile</p>
            <p className="text-xs text-zinc-500 mt-0.5">Include school, form &amp; more</p>
          </button>
        </div>

        {/* ── Quick Guest signup ──────────────────────────────────────── */}
        {showGuest && (
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shrink-0">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h2 className="font-black">Visitor</h2>
                <p className="text-xs text-zinc-500">Profile &amp; full Lion Tools access — no school details needed</p>
              </div>
            </div>

            <form onSubmit={handleGuestSignup} className="space-y-3">
              {guestError && (
                <div className="rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">{guestError}</div>
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
              <button type="submit" disabled={guestLoading}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white hover:bg-amber-500 transition-colors disabled:opacity-50">
                {guestLoading ? "Creating account…" : "Join as Visitor 🦁"}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-600">
              Calabar student?{" "}
              <button onClick={() => setShowGuest(false)} className="text-green-400 hover:text-green-300 font-semibold">Create a full profile →</button>
            </p>
          </div>
        )}

        {/* ── Full signup ─────────────────────────────────────────────── */}
        {!showGuest && (
          <>
            <div className="mb-6 flex items-center justify-center gap-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-2 w-16 rounded-full transition-colors ${step >= s ? "bg-green-600" : "bg-zinc-700"}`} />
              ))}
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup} className="card space-y-4">
              {error && <div className="rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

              {step === 1 && (
                <>
                  <h2 className="font-black text-lg">Account details</h2>
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="Marcus Williams" value={form.fullName} onChange={e => update("fullName", e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" placeholder="you@school.edu.jm" value={form.email} onChange={e => update("email", e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => update("password", e.target.value)} minLength={8} required />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-base">Continue →</button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-black text-lg">Your academic profile</h2>
                  <div>
                    <label className="label">I am a...</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map(r => (
                        <button key={r.value} type="button" onClick={() => update("role", r.value)}
                          className={`rounded-xl border p-3 text-left text-sm font-semibold transition-colors ${form.role === r.value ? "border-green-600 bg-green-950 text-green-300" : "border-zinc-700 hover:border-zinc-600"}`}>
                          <span className="mr-2">{r.icon}</span>{r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.role === "student" && (
                    <div>
                      <label className="label">Form</label>
                      <select className="input" value={form.studentForm} onChange={e => update("studentForm", e.target.value)}>
                        <option value="">Select form</option>
                        {forms.map(f => <option key={f} value={f}>Form {f}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="label">Bio (optional)</label>
                    <textarea className="input min-h-[80px] resize-none" placeholder="Tell the pride about yourself..." value={form.bio} onChange={e => update("bio", e.target.value)} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base disabled:opacity-50">
                      {loading ? "Creating account…" : "Join the Pride 🦁"}
                    </button>
                  </div>
                </>
              )}

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-green-400 hover:text-green-300">Sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
