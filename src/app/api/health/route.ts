import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "profiles",
  "houses",
  "groups",
  "documents",
  "spreadsheets",
  "slide_decks",
  "document_versions",
  "document_shares",
  "tool_comments",
  "sba_projects",
  "sba_files",
  "notifications",
];

type Probe = { ok: boolean; error?: string };

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: {
      present: Boolean(url),
      looksValid: /^https?:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
      hasWhitespace:
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== url,
    },
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
      present: Boolean(key),
      looksValid: /^sb_publishable_/.test(key) || /^eyJ/.test(key),
      hasWhitespace:
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== key,
    },
  };

  const tables: Record<string, Probe> = {};
  let reachable: Probe = { ok: false, error: "env vars missing" };

  if (env.NEXT_PUBLIC_SUPABASE_URL.present && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.present) {
    try {
      const root = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
        headers: { apikey: key },
        cache: "no-store",
      });
      reachable = { ok: root.status < 500 };
      for (const t of REQUIRED_TABLES) {
        try {
          const r = await fetch(
            `${url.replace(/\/$/, "")}/rest/v1/${t}?select=*&limit=0`,
            {
              headers: { apikey: key, Authorization: `Bearer ${key}` },
              cache: "no-store",
            },
          );
          if (r.ok || r.status === 401 || r.status === 403) {
            // 401/403 means table exists but RLS blocks anon — counts as present.
            tables[t] = { ok: true };
          } else {
            const body = await r.text();
            tables[t] = { ok: false, error: `${r.status}: ${body.slice(0, 160)}` };
          }
        } catch (e) {
          tables[t] = { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
        }
      }
    } catch (e) {
      reachable = { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
    }
  }

  const allTablesOk = Object.values(tables).every((p) => p.ok);
  const allEnvOk =
    env.NEXT_PUBLIC_SUPABASE_URL.present &&
    env.NEXT_PUBLIC_SUPABASE_URL.looksValid &&
    !env.NEXT_PUBLIC_SUPABASE_URL.hasWhitespace &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.present &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.looksValid &&
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.hasWhitespace;

  return NextResponse.json(
    {
      ok: allEnvOk && reachable.ok && allTablesOk,
      env,
      reachable,
      tables,
      hint: !allEnvOk
        ? "Set the env vars on this Vercel project (Production + Preview + Development) and redeploy."
        : !reachable.ok
          ? "Vercel can't reach the Supabase project. Check the URL value is exact."
          : !allTablesOk
            ? "Some tables are missing. Re-run supabase/schema.sql in the Supabase SQL editor."
            : "All checks passed.",
    },
    { status: 200 },
  );
}
