import Link from "next/link";
import { JoinForm } from "@/components/join-form";

export default function Home() {
  return (
    <main>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-lion-500 text-white">
              CL
            </span>
            <span className="text-lg tracking-tight">Calabar Lions</span>
          </Link>
          <nav className="hidden gap-7 text-sm text-stone-600 sm:flex">
            <a href="#about" className="hover:text-stone-900">About</a>
            <a href="#pillars" className="hover:text-stone-900">What we do</a>
            <a href="#join" className="hover:text-stone-900">Join</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-lion-50 via-white to-stone-50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-lion-600">
            The Calabar Lions Network
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
            A pride of builders, leaders, and storytellers from Calabar.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600">
            We connect alumni, entrepreneurs, creators, and changemakers tied to
            Calabar &mdash; opening doors to mentorship, funding, and friendship
            across the continent and the diaspora.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#join"
              className="rounded-full bg-lion-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-lion-600"
            >
              Join the network
            </a>
            <a
              href="#about"
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Who we are</h2>
            <p className="mt-4 text-stone-600">
              The Calabar Lions network is a community of people who trace their
              roots, schooling, work, or heart to Calabar &mdash; the Canaan
              City. We meet in person, online, and in projects that lift our
              people and our place.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6 text-center">
            <Stat label="Members" value="500+" />
            <Stat label="Cities" value="22" />
            <Stat label="Chapters" value="6" />
            <Stat label="Events / yr" value="40+" />
          </dl>
        </div>
      </section>

      <section id="pillars" className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">What we do</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Pillar
              title="Mentorship"
              body="Senior Lions guide students and early-career members through curated 1:1 pairings."
            />
            <Pillar
              title="Ventures"
              body="We back Calabar-rooted founders with introductions, early customers, and angel cheques."
            />
            <Pillar
              title="Culture"
              body="From the Carnival to the cuisine, we celebrate and document what makes Calabar, Calabar."
            />
          </div>
        </div>
      </section>

      <section id="join" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Join the pride</h2>
            <p className="mt-4 text-stone-600">
              Tell us a little about yourself. We&rsquo;ll get back to you with
              an invite to the next gathering nearest you.
            </p>
          </div>
          <JoinForm />
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Calabar Lions. Made with pride.
          </p>
          <p className="text-sm text-stone-400">Calabar &middot; Lagos &middot; London &middot; Houston</p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
      <dd className="text-3xl font-bold text-lion-600">{value}</dd>
      <dt className="mt-1 text-sm text-stone-600">{label}</dt>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}
