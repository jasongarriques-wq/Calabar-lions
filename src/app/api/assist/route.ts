import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  action: "improve" | "check" | "formal";
  body: string;
  prompt?: string;
};

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        text:
          "AI assistant isn't configured yet. Add ANTHROPIC_API_KEY to Vercel env vars to enable Improve / Check SBA / Formal Tone.",
        configured: false,
      },
      { status: 503 },
    );
  }

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ text: "Invalid JSON." }, { status: 400 });
  }

  const sys =
    payload.action === "improve"
      ? "You are a writing tutor for Caribbean secondary-school students. Rewrite the user's draft to improve clarity, flow, and academic tone for a CSEC/CAPE SBA. Return the rewritten text only."
      : payload.action === "formal"
        ? "Convert the user's draft to a formal academic tone suitable for a CSEC/CAPE SBA. Return only the rewritten text."
        : "You are an SBA marker. Review the user's draft and list specific, concrete fixes (max 6 bullet points). Do not rewrite.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: sys,
        messages: [
          {
            role: "user",
            content:
              (payload.prompt ? `${payload.prompt}\n\n` : "") +
              `Draft:\n${payload.body.replace(/<[^>]*>/g, " ").slice(0, 6000)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { text: `Claude API error (${res.status}): ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as { content?: { text?: string }[] };
    const text = json.content?.[0]?.text ?? "No response.";
    return NextResponse.json({ text, configured: true });
  } catch (e) {
    return NextResponse.json(
      { text: e instanceof Error ? e.message : "Network error reaching Anthropic API." },
      { status: 502 },
    );
  }
}
