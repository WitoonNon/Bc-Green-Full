import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

// Endpoint used by backoffice UI (or a script) to change a user's role.
// A developer or admin can call `PUT /api/backoffice/users/{uid}/role` with
// { role: "admin"|"technician"|"user" } in the JSON body.
//
// The handler updates both the Firestore profile document and the user's
// custom claim so that `auth.currentUser.token` contains the role.

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const { uid } = await context.params;
  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { role } = body;
  if (!role || !["user", "technician", "admin"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  try {
    const auth = await getAdminAuth();
    // set custom claim
    await auth.setCustomUserClaims(uid, { role });
    const db = await getAdminDb();
    await db.collection("users").doc(uid).set({ role }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("failed to update role", err);
    const message =
      err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
