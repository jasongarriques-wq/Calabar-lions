import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Join the network</h1>
        <p className="mt-2 text-stone-600">
          Open to students, teachers, alumni, and parents tied to Calabar High School.
        </p>
        <SignupForm />
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
