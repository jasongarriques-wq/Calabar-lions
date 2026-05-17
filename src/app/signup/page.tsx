import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { SignupForm } from "./signup-form";
import { GuestSignInButton } from "@/components/guest-signin-button";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const { reason } = await searchParams;
  const isToolsRedirect = reason === "tools";

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-6 py-16">
        {isToolsRedirect && (
          <div className="mb-6 rounded-2xl border border-calabar-gold-200 bg-calabar-gold-50 p-4">
            <p className="text-sm font-semibold text-calabar-gold-800">
              Sign up to unlock Lion Tools
            </p>
            <p className="mt-1 text-sm text-calabar-gold-800/80">
              Docs, Sheets, Slides, Notes, and the SBA Workspace need a permanent
              account so your work, comments, and teacher reviews stick around.
            </p>
          </div>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight">Join the network</h1>
        <p className="mt-2 text-stone-600">
          Open to students, teachers, alumni, and parents tied to Calabar High School.
        </p>
        <SignupForm />
        {!isToolsRedirect && (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-stone-200" />
              <span className="text-xs uppercase tracking-wider text-stone-500">or</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <GuestSignInButton className="mt-6" />
          </>
        )}
        <p className="mt-6 text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-calabar-green-700 hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
