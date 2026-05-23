import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { GuestSignInButton } from "@/components/guest-signin-button";

export default function Home() {
  return (
    <main className="bg-calabar-ink">
      <Navbar />

      {/* Hero — full-bleed pride scene */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/lion-pride.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-calabar-ink/40 via-calabar-ink/60 to-calabar-ink" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center text-white sm:py-32">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40">
            <Image
              src="/lion-shield.png"
              alt="Calabar Lions shield"
              fill
              priority
              sizes="160px"
              className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            />
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.4em] text-calabar-gold-300">
            Calabar High School &middot; Kingston, Jamaica
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            The Outmost for the Highest
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-200">
            One pride. One platform. The digital home of every Calabar Lion &mdash; students,
            teachers, alumni, and parents.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-gold text-sm">
              Create your account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Log in
            </Link>
            <span className="text-sm text-stone-300/80">or</span>
            <GuestSignInButton className="w-full max-w-[16rem]" />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-calabar-green-700">
            What lives here
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-bold tracking-tight text-calabar-ink sm:text-4xl">
            Built for every Lion, from first form to alumni life.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              title="House pride"
              body="See your house standings, captain announcements, and a channel for every house."
            />
            <Feature
              title="CSEC & CAPE ready"
              body="Subject groups, SBA tracking, past papers, and study circles aligned with your real timetable."
            />
            <Feature
              title="Alumni mentorship"
              body="Vetted Old Boys mentor students one-on-one — careers, scholarships, and life advice."
            />
          </div>
        </div>
      </section>

      {/* Lion Tools */}
      <section className="relative isolate overflow-hidden bg-calabar-green-900 py-20 text-white">
        <div className="absolute inset-0 opacity-15">
          <Image src="/lion-pride.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-calabar-green-900/80 to-calabar-green-900" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-calabar-gold-300">
            Lion Tools
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your Calabar workspace, built in.
          </h2>
          <p className="mt-3 max-w-2xl italic text-calabar-gold-200">
            Write like a Lion. Submit with pride.
          </p>
          <p className="mt-3 max-w-2xl text-stone-200">
            Lion Docs, Sheets, Slides, Notes, and a full SBA workspace &mdash; signed in with
            your Calabar account.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ToolTile name="Lion Docs" desc="Essays & reports" />
            <ToolTile name="Lion Sheets" desc="Data & gradebooks" />
            <ToolTile name="Lion Slides" desc="Presentations" />
            <ToolTile name="Lion Notes" desc="Class notes" />
            <ToolTile name="SBA Workspace" desc="Full project hub" />
          </div>

          <div className="mt-10">
            <Link href="/tools" className="btn-gold text-sm">
              Open Lion Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-calabar-ink py-10 text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/lion-shield.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Calabar Lions. The Outmost for the Highest.
            </p>
          </div>
          <p className="text-xs uppercase tracking-widest text-calabar-gold-200">
            Kingston &middot; Jamaica
          </p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card border-stone-200">
      <h3 className="text-lg font-semibold text-calabar-green-800">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}

function ToolTile({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="font-semibold">{name}</p>
      <p className="mt-1 text-xs text-stone-300">{desc}</p>
    </div>
  );
}
