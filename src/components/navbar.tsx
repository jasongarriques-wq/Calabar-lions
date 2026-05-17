import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/houses", label: "Houses" },
  { href: "/groups", label: "Groups" },
  { href: "/sba", label: "SBA" },
  { href: "/resources", label: "Resources" },
  { href: "/mentorship", label: "Mentorship" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-calabar-green-700 text-calabar-gold-400">
            CL
          </span>
          <span className="text-lg tracking-tight">Calabar Lions</span>
        </Link>

        {user && (
          <nav className="order-3 hidden gap-5 text-sm text-stone-600 md:order-none md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-calabar-green-800">
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          {user && (
            <>
              <div className="hidden flex-1 sm:block">
                <GlobalSearch />
              </div>
              <NotificationBell />
            </>
          )}
          {user ? (
            <form action="/auth/logout" method="post">
              <button type="submit" className="btn-secondary">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
