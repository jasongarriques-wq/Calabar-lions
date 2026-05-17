import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { NavbarMobileMenu } from "@/components/navbar-mobile-menu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/houses", label: "Houses" },
  { href: "/groups", label: "Groups" },
  { href: "/tools", label: "Lion Tools" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {user && <NavbarMobileMenu links={links} />}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-calabar-green-700 text-calabar-gold-400">
              CL
            </span>
            <span className="text-lg tracking-tight">Calabar Lions</span>
          </Link>
        </div>

        {user && (
          <nav className="hidden gap-5 text-sm text-stone-600 lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-calabar-green-800">
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-end gap-2">
          {user && (
            <>
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
              <NotificationBell />
            </>
          )}
          {user ? (
            <form action="/auth/logout" method="post">
              <button type="submit" className="btn-secondary text-xs sm:text-sm">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-xs sm:text-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary text-xs sm:text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
