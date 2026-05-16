import { Navbar } from "@/components/navbar";
import { MentorCard } from "@/components/mentor-card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Alumni mentorship" };

export default async function MentorshipPage() {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("mentors")
    .select(
      "id, full_name, graduation_year, industry, bio, avatar_url, capacity, taken, approved",
    )
    .eq("approved", true)
    .order("graduation_year", { ascending: false });

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Alumni mentorship</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Old Boys giving back. Every mentor is verified by Calabar staff before they
          appear here. Request a 1:1 and a coordinator will pair you within a week.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(mentors ?? []).length === 0 && (
            <p className="text-sm text-stone-500">No mentors approved yet.</p>
          )}
          {(mentors ?? []).map((m) => {
            const row = m as unknown as {
              id: string;
              full_name: string;
              graduation_year: number | null;
              industry: string | null;
              bio: string | null;
              avatar_url: string | null;
              capacity: number | null;
              taken: number | null;
            };
            return <MentorCard key={row.id} mentor={row} />;
          })}
        </div>
      </section>
    </main>
  );
}
