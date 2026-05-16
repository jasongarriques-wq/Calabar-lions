import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { LoginForm } from "./login-form";
import { GuestSignInButton } from "@/components/guest-signin-button";

export const metadata = { title: "Log in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-stone-600">Sign in to your Calabar Lions account.</p>
        <LoginForm searchParams={searchParams} />
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-xs uppercase tracking-wider text-stone-500">or</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <GuestSignInButton className="mt-6" />
        <p className="mt-6 text-sm text-stone-600">
          New to the network?{" "}
          <Link href="/signup" className="font-semibold text-calabar-green-700 hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
