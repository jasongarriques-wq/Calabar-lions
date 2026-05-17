"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function NavbarMobileMenu({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white hover:bg-stone-50 lg:hidden"
      >
        <Menu className="h-4 w-4 text-stone-700" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-calabar-ink/50"
          />
          <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="font-display text-lg font-bold">Calabar Lions</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-calabar-green-50 hover:text-calabar-green-800"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-stone-100 pt-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-calabar-green-50 hover:text-calabar-green-800"
                >
                  Notifications
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
