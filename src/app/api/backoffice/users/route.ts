import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { backend } from "@/lib/backend.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserPayload = {
  uid?: string;
  // first and last name allowed in addition to displayName
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: "user" | "technician" | "admin";
  password?: string;
};

async function hasSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return !!session?.value;
}

function validateRole(role?: string) {
  return role === "user" || role === "technician" || role === "admin";
}

export async function GET() {
  // return all users; authorization already handled elsewhere in middleware
  try {
    const users = await backend.fetchUsers();
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unable to list users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let payload: UserPayload;
  try {
    payload = (await request.json()) as UserPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!payload.email || !payload.password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }
  if (!validateRole(payload.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    const displayNameFromNames = [payload.firstName, payload.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const finalDisplayName =
      payload.displayName?.trim() || displayNameFromNames || undefined;

    if (!isAdminConfigured) {
      const uid = await backend.createUser({
        email: payload.email.trim(),
        password: payload.password,
        displayName: finalDisplayName,
        firstName: payload.firstName?.trim() || "",
        lastName: payload.lastName?.trim() || "",
        phone: payload.phone?.trim() || "",
        role: payload.role,
      });
      return NextResponse.json({ ok: true, uid });
    }

    const auth = await getAdminAuth();
    const db = await getAdminDb();

    const userRecord = await auth.createUser({
      email: payload.email.trim(),
      password: payload.password,
      displayName: finalDisplayName,
    });
    const now = new Date().toISOString();
    await db.collection("users").doc(userRecord.uid).set({
      // store both separate and combined fields for convenience
      firstName: payload.firstName?.trim() || "",
      lastName: payload.lastName?.trim() || "",
      displayName: finalDisplayName || "",
      email: payload.email.trim(),
      phone: payload.phone?.trim() || "",
      role: payload.role,
      address: { line1: "", district: "", province: "", zip: "" },
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (error) {
    console.error("[api/backoffice/users] POST error", error);
    const message =
      error instanceof Error ? error.message : "Unable to create user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let payload: UserPayload;
  try {
    payload = (await request.json()) as UserPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!payload.uid) {
    return NextResponse.json({ error: "Missing UID." }, { status: 400 });
  }
  if (payload.role && !validateRole(payload.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    const displayNameFromNames = [payload.firstName, payload.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const finalDisplayName =
      payload.displayName?.trim() || displayNameFromNames || undefined;

    if (!isAdminConfigured) {
      await backend.updateProfile(payload.uid, {
        firstName: payload.firstName?.trim(),
        lastName: payload.lastName?.trim(),
        displayName:
          payload.displayName?.trim() ||
          [payload.firstName, payload.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
        email: payload.email?.trim(),
        phone: payload.phone?.trim(),
        role: payload.role,
      });
      return NextResponse.json({ ok: true });
    }

    const auth = await getAdminAuth();
    const db = await getAdminDb();
    if (
      payload.email ||
      payload.password ||
      payload.displayName ||
      payload.firstName ||
      payload.lastName
    ) {

      await auth.updateUser(payload.uid, {
        email: payload.email?.trim(),
        password: payload.password,
        displayName: finalDisplayName,
      });
    }
    const now = new Date().toISOString();
    await db
      .collection("users")
      .doc(payload.uid)
      .set(
        {
          firstName: payload.firstName?.trim(),
          lastName: payload.lastName?.trim(),
          displayName:
            payload.displayName?.trim() ||
            [payload.firstName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim(),
          email: payload.email?.trim(),
          phone: payload.phone?.trim(),
          role: payload.role,
          updatedAt: now,
        },
        { merge: true },
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/backoffice/users] PATCH error", error);
    const message =
      error instanceof Error ? error.message : "Unable to update user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
