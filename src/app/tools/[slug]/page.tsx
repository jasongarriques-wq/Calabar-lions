import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { LION_TOOLS, findTool } from "../tool-data";

export function generateStaticParams() {
  return LION_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = findTool(slug);
  return { title: tool?.name ?? "Lion Tools" };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/tools" className="text-sm text-calabar-green-700 hover:underline">
          ← All Lion Tools
        </Link>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight">{tool.name}</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wider text-calabar-green-700">
          {tool.type}
        </p>
        <p className="mt-4 text-stone-600">{tool.description}</p>

        <div className="mt-8 rounded-2xl border-2 border-dashed border-calabar-gold-300 bg-calabar-gold-50 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-calabar-gold-800">
            Coming soon
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {tool.name} is being built.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-stone-600">
            We&rsquo;re rolling out the Lion Tools suite one app at a time. Want this one
            prioritised? Tell your form teacher or post in the #feedback channel.
          </p>
          <Link href="/tools" className="btn-primary mt-6 text-sm">
            Back to Lion Tools
          </Link>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold">What you&rsquo;ll be able to do</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {tool.features.map((f) => (
              <li key={f} className="rounded-xl bg-stone-50 p-3 text-sm">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
