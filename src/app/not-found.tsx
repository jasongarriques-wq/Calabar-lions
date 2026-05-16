import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-calabar-green-700">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-stone-600">
          We couldn&rsquo;t find what you were looking for. Try the dashboard.
        </p>
        <div className="mt-6">
          <Link href="/" className="btn-primary">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
