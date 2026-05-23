export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import MentorCard from "@/components/mentor-card";
import type { Profile, Mentor } from "@/types";

export default async function MentorshipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: mentors }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("mentors").select("*, profiles(*)").eq("verified", true).gt("capacity", 0).order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/signup");

  const industries = ["All", "Technology", "Finance", "Law", "Medicine", "Engineering", "Education", "Business", "Arts"];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <Navbar profile={profile as Profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">🎓 Mentorship</h1>
          <p className="text-sm text-zinc-500">Connect with Calabar alumni who&apos;ve paved the way</p>
        </div>

        {/* Info banner */}
        <div className="mb-6 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 flex gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-amber-400 text-sm">Old Boys Network</p>
            <p className="text-xs text-zinc-400 mt-0.5">Mentors are verified alumni who volunteer their time. Request a pairing and a coordinator will match you within 3–5 business days.</p>
          </div>
        </div>

        {/* Industry filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {industries.map(ind => (
            <button key={ind} className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-semibold hover:border-green-700 hover:text-green-400 transition-colors">
              {ind}
            </button>
          ))}
        </div>

        {/* Mentors */}
        <div className="space-y-4">
          {mentors?.map((m: Mentor) => <MentorCard key={m.id} mentor={m} />)}
          {(!mentors || mentors.length === 0) && (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🎓</p>
              <p className="font-black">No mentors available right now</p>
              <p className="text-sm text-zinc-500 mt-1">Check back soon as we verify more alumni mentors.</p>
            </div>
          )}
        </div>

        {/* Become a mentor CTA for alumni */}
        {profile.role === "alumni" && (
          <div className="mt-8 card border-amber-900/50 bg-amber-950/20 text-center">
            <p className="text-lg font-black">Are you an alumnus?</p>
            <p className="text-sm text-zinc-400 mt-1">Give back to the pride. Sign up as a mentor today.</p>
            <button className="btn-primary mt-4">Become a Mentor</button>
          </div>
        )}
      </main>
    </div>
  );
}
