"use client";

import Link from "next/link";

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const looksLikeEnv = /supabase env vars missing/i.test(error.message ?? "");
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Lion Tools is offline
      </h1>
      <p className="mt-3 text-stone-600">
        Something went wrong loading this page. The most common cause is missing
        environment variables on the deployment.
      </p>

      {looksLikeEnv ? (
        <div className="mt-6 rounded-2xl border border-calabar-gold-200 bg-calabar-gold-50 p-5 text-sm">
          <p className="font-semibold text-calabar-gold-800">
            Supabase isn&rsquo;t configured for this deployment.
          </p>
          <p className="mt-2 text-calabar-gold-800/80">
            In Vercel &rarr; <em>project</em> &rarr; Settings &rarr; Environment Variables, add:
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs">
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></li>
          </ul>
          <p className="mt-2 text-calabar-gold-800/80">
            Apply to <strong>Production + Preview + Development</strong>, then redeploy.
          </p>
        </div>
      ) : (
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700">
{`${error.message || "Unknown error"}${error.digest ? `\n\nDigest: ${error.digest}` : ""}`}
        </pre>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
