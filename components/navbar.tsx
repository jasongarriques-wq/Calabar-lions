"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";


const mobileLinks = [
  { href: "/dashboard", label: "Home", icon: "🏠", badge: false },
  { href: "/groups", label: "Groups", icon: "👥", badge: false },
  { href: "/classes", label: "Classes", icon: "📚", badge: false },
  { href: "/houses", label: "Houses", icon: "🏛️", badge: false },
  { href: "/tools", label: "Tools", icon: "🛠️", badge: false },
  { href: "/play", label: "Play", icon: "🎲", badge: true },
];

const desktopLinks = [
  { href: "/dashboard", label: "Home", icon: "🏠", badge: false },
  { href: "/groups", label: "Groups", icon: "👥", badge: false },
  { href: "/classes", label: "Classes", icon: "📚", badge: false },
  { href: "/houses", label: "Houses", icon: "🏛️", badge: false },
  { href: "/mentorship", label: "Mentors", icon: "🎓", badge: false },
  { href: "/resources", label: "Resources", icon: "📎", badge: false },
  { href: "/tools", label: "Tools", icon: "🛠️", badge: false },
  { href: "/sba", label: "SBA", icon: "📊", badge: false },
];

export default function Navbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🦁</span>
            <span className="font-black tracking-tight">Calabar Lions</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-[600px]">
            {desktopLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`relative shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${pathname === l.href || pathname.startsWith(l.href + "/") ? "bg-green-950 text-green-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                {l.icon} {l.label}
                {l.badge && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse border border-zinc-950" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* 🎲 Domino Play CTA — always visible in top bar */}
            <Link
              href="/play"
              className="relative hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500 transition-colors shadow-[0_0_12px_#10b98150]"
            >
              🎲 Play
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </Link>
            <Link href="/notifications" className="rounded-xl bg-zinc-800 p-2 text-sm hover:bg-zinc-700">🔔</Link>
            {profile ? (
              <div className="flex items-center gap-2">
                <Link href={`/profile/${profile.id}`} className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-semibold hover:bg-zinc-700">
                  <span>{(profile.full_name ?? profile.display_name ?? "Lion").split(" ")[0]}</span>
                </Link>
                <button onClick={handleSignOut} className="rounded-xl bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-700">
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <div className="grid grid-cols-6">
          {mobileLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`relative flex flex-col items-center py-3 text-xs font-semibold transition-colors ${pathname === l.href || pathname.startsWith(l.href + "/") ? "text-green-400" : "text-zinc-500"}`}>
              <span className="text-lg relative">
                {l.icon}
                {l.badge && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </span>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
