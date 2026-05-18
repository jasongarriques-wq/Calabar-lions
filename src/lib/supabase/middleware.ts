import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/houses",
  "/groups",
  "/sba",
  "/resources",
  "/mentorship",
  "/admin",
  "/notifications",
  "/tools",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  let user: { is_anonymous?: boolean | null } | null = null;
  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch (e) {
    console.error("[middleware] auth.getUser failed", e);
  }

  const path = request.nextUrl.pathname;
  const requiresAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  if (requiresAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Lion Tools require a real account; bounce guests to sign up.
  if (path.startsWith("/tools") && user?.is_anonymous) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    url.searchParams.set("reason", "tools");
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
