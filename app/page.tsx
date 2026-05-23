import Link from "next/link";

const features = [
  { icon: "📚", title: "SBA Tracker", desc: "Track your School-Based Assessments from start to submission." },
  { icon: "👥", title: "Study Groups", desc: "Join subject groups, school groups, and club communities." },
  { icon: "📎", title: "Resource Library", desc: "Access and share past papers, notes, and study guides." },
  { icon: "🏆", title: "Achievement Badges", desc: "Earn badges for academic milestones and community contributions." },
  { icon: "🏫", title: "School Profiles", desc: "Connect with your school's full community in one place." },
  { icon: "🎓", title: "Multi-Exam Support", desc: "CSEC, CAPE, and PEP all supported under one roof." },
];

const stats = [
  { value: "10K+", label: "Students" },
  { value: "200+", label: "Schools" },
  { value: "50+", label: "Subjects" },
  { value: "95%", label: "Pass Rate" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦁</span>
            <span className="text-lg font-black tracking-tight">Calabar Lions</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-zinc-300 hover:text-white">Sign In</Link>
            <Link href="/signup" className="btn-primary">Join Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-32 text-center min-h-[85vh] flex items-center">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-zinc-950/70" />
        {/* Green glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#16a34a25,transparent_65%)]" />
        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative mx-auto max-w-4xl w-full">
          <span className="mb-4 inline-block rounded-full bg-green-950/80 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-400 ring-1 ring-green-700 backdrop-blur-sm">
            For CSEC · CAPE · PEP Students
          </span>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight md:text-7xl drop-shadow-2xl">
            Study Together.<br />
            <span className="text-green-400">Win Together.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-300 drop-shadow-lg">
            Built for the Lions of Calabar High — track your SBAs, link with your year group,
            rep your house, and leave your mark on the Hill.
          </p>
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-green-500/80">
            The Outmost for the Highest
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="rounded-2xl bg-green-600 px-8 py-4 text-base font-black hover:bg-green-500 transition-colors shadow-lg shadow-green-900/40">
              Get Started Free
            </Link>
            <Link href="/login" className="rounded-2xl border border-zinc-500/60 bg-zinc-900/60 backdrop-blur-sm px-8 py-4 text-base font-semibold hover:bg-zinc-800 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black text-green-400">{s.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black md:text-4xl">Everything you need to excel</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
            Built specifically for the Caribbean curriculum and school culture.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card hover:border-green-900 transition-colors">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="font-black">{f.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-zinc-900 px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black md:text-4xl">For the whole school community</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["Students 📓", "Teachers 🏫", "Alumni 🎓", "Parents 👨‍👩‍👧", "School Admins 🛡️", "Group Leaders 👑"].map((r) => (
              <span key={r} className="rounded-full border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-semibold">
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-black md:text-5xl">Ready to roar? 🦁</h2>
          <p className="mt-4 text-zinc-400">Join thousands of students already building their academic legacy.</p>
          <Link href="/signup" className="mt-8 inline-block rounded-2xl bg-green-600 px-10 py-4 text-lg font-black hover:bg-green-500 transition-colors">
            Join Calabar Lions Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-5 py-8 text-center text-sm text-zinc-600">
        © {new Date().getFullYear()} Calabar Lions. Built for Caribbean students. 🇯🇲
      </footer>
    </div>
  );
}
