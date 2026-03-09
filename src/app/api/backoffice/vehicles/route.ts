import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { vehicles as seedVehicles } from "@/data/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VehiclePayload = {
  action?: "seed";
  id?: string;
  name?: string;
  code?: string;
  warranty?: string;
  image?: string;
  published?: boolean;
};

async function requireStaff(request: Request) {
  if (!isAdminConfigured) {
    return { mock: true, db: null, uid: "mock-uid" };
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { error: "Unauthorized." };
  }
  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const db = await getAdminDb();
    const snap = await db.collection("users").doc(decoded.uid).get();
    const role = snap.data()?.role;
    if (role !== "admin" && role !== "technician") {
      return { error: "Forbidden." };
    }
    return { db, uid: decoded.uid };
  } catch (err: any) {
    return { error: err.message === "Firebase Admin is not configured." ? err.message : "Unauthorized." };
  }
}

export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if ("mock" in auth) {
    return NextResponse.json({ ok: true, id: "mock-" + Date.now() });
  }
  let payload: VehiclePayload;
  try {
    payload = (await request.json()) as VehiclePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (payload.action === "seed") {
    const now = new Date().toISOString();
    const batch = auth.db.batch();
    seedVehicles.forEach((vehicle) => {
      const ref = auth.db.collection("vehicles").doc(vehicle.id);
      batch.set(
        ref,
        {
          name: vehicle.name,
          code: vehicle.code,
          warranty: vehicle.warranty,
          image: vehicle.image,
          published: true,
          seed: true,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true },
      );
    });
    await batch.commit();
    return NextResponse.json({ ok: true });
  }

  if (!payload.name) {
    return NextResponse.json(
      { error: "Vehicle name is required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const ref = payload.id
    ? auth.db.collection("vehicles").doc(payload.id)
    : auth.db.collection("vehicles").doc();
  await ref.set(
    {
      name: payload.name,
      code: payload.code ?? "",
      warranty: payload.warranty ?? "",
      image: payload.image ?? "",
      published: payload.published ?? true,
      updatedAt: now,
      createdAt: payload.id ? undefined : now,
    },
    { merge: true },
  );
  return NextResponse.json({ ok: true, id: ref.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if ("mock" in auth) {
    return NextResponse.json({ ok: true });
  }
  let payload: VehiclePayload;
  try {
    payload = (await request.json()) as VehiclePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  if (!payload.id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  const now = new Date().toISOString();
  await auth.db
    .collection("vehicles")
    .doc(payload.id)
    .set(
      {
        name: payload.name,
        code: payload.code,
        warranty: payload.warranty,
        image: payload.image,
        published: payload.published,
        updatedAt: now,
      },
      { merge: true },
    );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireStaff(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if ("mock" in auth) {
    return NextResponse.json({ ok: true });
  }
  let payload: VehiclePayload;
  try {
    payload = (await request.json()) as VehiclePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  if (!payload.id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  await auth.db.collection("vehicles").doc(payload.id).delete();
  return NextResponse.json({ ok: true });
}
