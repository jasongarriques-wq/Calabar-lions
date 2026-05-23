"use client";

import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const looksLikeEnv = /supabase env vars missing/i.test(error.message ?? "");
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Something went wrong</h1>
      {looksLikeEnv ? (
        <p className="mt-3 text-stone-600">
          The deployment is missing Supabase environment variables. In Vercel &rarr; project
          &rarr; Settings &rarr; Environment Variables, add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> for Production, Preview, and
          Development, then redeploy.
        </p>
      ) : (
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700">
{`${error.message || "Unknown error"}${error.digest ? `\n\nDigest: ${error.digest}` : ""}`}
        </pre>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/api/health" target="_blank" rel="noreferrer" className="btn-secondary">
          Run diagnostics
        </a>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Diagnostics check env vars and required tables. The JSON tells you exactly what to fix.
      </p>
    </main>
  );
}
