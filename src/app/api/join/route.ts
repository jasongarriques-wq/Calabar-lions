import { NextResponse } from "next/server";

type JoinRequest = {
  name?: unknown;
  email?: unknown;
  city?: unknown;
  story?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: JoinRequest;
  try {
    body = (await req.json()) as JoinRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please share your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please share a valid email." }, { status: 400 });
  }

  // TODO: persist the submission (e.g. KV, Postgres, email-to-list) once the
  // backing service is chosen. For now, log and accept.
  console.log("[join]", { name, email, city: body.city, story: body.story });

  return NextResponse.json({ ok: true });
}
