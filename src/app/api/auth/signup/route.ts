import { NextResponse } from "next/server";
import { backend, NewUserData } from "@/lib/backend.server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { displayName, email, password } = body as {
    displayName?: string;
    email?: string;
    password?: string;
  };
  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (backend.createUser) {
    try {
      const id = await backend.createUser({
        displayName,
        email,
        password,
        role: "user",
      } as NewUserData);
      const res = NextResponse.json({ ok: true, id });
      // set simple session cookie on server
      res.cookies.set("bc_session", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Firebase signup only" }, { status: 400 });
}
