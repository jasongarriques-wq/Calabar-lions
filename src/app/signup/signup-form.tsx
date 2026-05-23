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

const GRADES = [
  { value: "7", form: "First Form" },
  { value: "8", form: "Second Form" },
  { value: "9", form: "Third Form" },
  { value: "10", form: "Fourth Form" },
  { value: "11", form: "Fifth Form" },
  { value: "12", form: "Lower Sixth" },
  { value: "13", form: "Upper Sixth" },
];

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState("student");

  const isStudent = role === "student";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const data = new FormData(e.currentTarget);
    const supabase = createClient();
    const email = String(data.get("email") ?? "");
    const gradeStr = String(data.get("grade") ?? "");
    const grade = gradeStr ? Number(gradeStr) : null;
    const form = grade ? GRADES.find((g) => g.value === gradeStr)?.form : null;
    const { error } = await supabase.auth.signUp({
      email,
      password: String(data.get("password") ?? ""),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: String(data.get("full_name") ?? ""),
          role,
          grade,
          form,
          class_group: String(data.get("class_group") ?? "") || null,
          graduating_year: data.get("graduating_year")
            ? Number(data.get("graduating_year"))
            : null,
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
        <select
          id="role"
          name="role"
          required
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {isStudent && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="grade" className="label">Grade</label>
            <select id="grade" name="grade" className="input" defaultValue="">
              <option value="" disabled>Select grade</option>
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  Grade {g.value} · {g.form}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="class_group" className="label">Class</label>
            <input
              id="class_group"
              name="class_group"
              placeholder="e.g. 11-3"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="graduating_year" className="label">
              Graduating year
            </label>
            <input
              id="graduating_year"
              name="graduating_year"
              type="number"
              min="2024"
              max="2040"
              placeholder="e.g. 2027"
              className="input"
            />
          </div>
        </div>
      )}

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
