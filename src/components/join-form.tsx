"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "ok" | "error";

export function JoinForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage("Thank you — we'll be in touch.");
      e.currentTarget.reset();
    } else {
      setStatus("error");
      setMessage(json?.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field name="name" label="Full name" required />
      <Field name="email" label="Email" type="email" required />
      <Field name="city" label="Where are you based?" />
      <div>
        <label htmlFor="story" className="mb-1 block text-sm font-medium text-stone-700">
          What ties you to Calabar?
        </label>
        <textarea
          id="story"
          name="story"
          rows={4}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-lion-500 focus:outline-none focus:ring-2 focus:ring-lion-200"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-lion-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-lion-600 disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Request invite"}
      </button>
      {message && (
        <p
          role="status"
          className={`text-sm ${status === "ok" ? "text-green-700" : "text-red-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-lion-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-lion-500 focus:outline-none focus:ring-2 focus:ring-lion-200"
      />
    </div>
  );
}
