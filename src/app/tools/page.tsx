import { Navbar } from "@/components/navbar";
import { GuestUpgradeBanner } from "@/components/guest-upgrade-banner";
import { createClient } from "@/lib/supabase/server";
import { LionToolsGrid } from "./lion-tools";

export const metadata = { title: "Lion Tools" };

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = Boolean(user?.is_anonymous);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        {isGuest && <GuestUpgradeBanner />}
        <LionToolsGrid />
      </section>
    </main>
  );
}
