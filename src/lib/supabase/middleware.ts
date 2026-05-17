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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
