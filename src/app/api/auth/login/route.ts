import { NextResponse } from "next/server";
import { backend } from "@/lib/backend.server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  if (backend.authenticate) {
    const user = await backend.authenticate(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid login" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("bc_session", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ error: "Firebase login only" }, { status: 400 });
}
