import { Navbar } from "@/components/navbar";
import { LionToolsGrid } from "./lion-tools";

export const metadata = { title: "Lion Tools" };

export default function ToolsPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <LionToolsGrid />
      </section>
    </main>
  );
}
