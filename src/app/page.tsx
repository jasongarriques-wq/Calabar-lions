import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { GuestSignInButton } from "@/components/guest-signin-button";

export default function Home() {
  return (
    <main>
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-to-br from-calabar-green-50 via-white to-calabar-gold-50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-calabar-green-700">
            Calabar High School &middot; Kingston, Jamaica
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-calabar-ink sm:text-6xl">
            One school. One brotherhood. One platform.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            The Calabar Lions network connects students, teachers, alumni, and
            parents around the houses, classes, clubs, and traditions that make
            Calabar what it is.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn-primary">
              Create your account
            </Link>
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <span className="text-sm text-stone-500">or</span>
            <GuestSignInButton className="w-full max-w-[16rem]" />
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          <Feature
            title="House pride"
            body="See your house standings, announcements from your house captain, and dedicated channels for every house."
          />
          <Feature
            title="CSEC & CAPE ready"
            body="Subject groups, SBA tracking, past papers, and study circles that mirror your real timetable."
          />
          <Feature
            title="Alumni mentorship"
            body="Vetted Old Boys mentor students one-on-one — careers, scholarships, and life advice."
          />
        </div>
      </section>

      <footer className="bg-calabar-green-900 text-stone-200">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Calabar Lions. The Utmost for the Highest.
          </p>
          <p className="text-sm text-calabar-gold-200">Kingston &middot; Jamaica</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-calabar-green-800">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}
