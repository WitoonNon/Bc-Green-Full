"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { uploadLocalFiles } from "@/lib/uploads/client";
import type { RepairCreateInput, RepairRequest, RepairStatus } from "@/types/repair";

const REPAIR_COLLECTION = "repairs";
const NOTICE_COLLECTION = "technicianNotices";

const STATUS_OPEN: RepairStatus[] = ["received", "diagnosing", "repairing"];

function ensureFirebase() {
  if (!db || !isFirebaseConfigured) {
    return false;
  }
  return true;
}

function ensureUser() {
  if (!auth) {
    return null;
  }
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    return null;
  }
  return user;
}


function generateTrackingCode() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `BC-${year}-${suffix}`;
}

export async function createRepairRequest(
  input: RepairCreateInput,
  files: File[],
) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }

  const user = ensureUser();
  if (!user) {
    return { ok: false, error: "Authentication is required." };
  }

  const now = new Date().toISOString();
  const trackingCode = generateTrackingCode();
  const firestore = db as Firestore;
  const docRef = await addDoc(collection(firestore, REPAIR_COLLECTION), {
    ...input,
    createdBy: user.uid,
    trackingCode,
    status: "received",
    createdAt: now,
    updatedAt: now,
    attachments: [],
    timeline: [{ status: "received", updatedAt: now }],
  });

  const attachments = await uploadLocalFiles(files, "repairs");
  const mappedAttachments = attachments.map((file) => ({
    name: file.name,
    url: file.url,
    type: file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
        ? "video"
        : "file",
  }));

  if (mappedAttachments.length) {
    await updateDoc(doc(firestore, REPAIR_COLLECTION, docRef.id), {
      attachments: mappedAttachments,
    });
  }

  await addDoc(collection(firestore, NOTICE_COLLECTION), {
    type: "new-repair",
    repairId: docRef.id,
    createdAt: now,
    seen: false,
    title: "New repair request",
    detail: `New repair request ${trackingCode}`,
  });

  return { ok: true, id: docRef.id, trackingCode };
}

export async function getRepairById(repairId: string) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const firestore = db as Firestore;
  const snap = await getDoc(doc(firestore, REPAIR_COLLECTION, repairId));
  if (!snap.exists()) {
    return { ok: false, error: "Repair not found." };
  }
  return { ok: true, data: { id: snap.id, ...snap.data() } };
}

export async function listOpenRepairs(limitCount = 20) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const firestore = db as Firestore;
  const snapshot = await getDocs(
    query(collection(firestore, REPAIR_COLLECTION), orderBy("createdAt", "desc")),
  );
  const items = snapshot.docs
    .map((docSnap) =>
      mapRepairFromData({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }),
    )
    .filter((item) => STATUS_OPEN.includes(item.status))
    .slice(0, limitCount);
  return { ok: true, data: items };
}

export async function updateRepairStatus(
  repairId: string,
  status: RepairStatus,
  note?: string,
) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const firestore = db as Firestore;
  const now = new Date().toISOString();
  await updateDoc(doc(firestore, REPAIR_COLLECTION, repairId), {
    status,
    updatedAt: now,
    timeline: arrayUnion({ status, updatedAt: now, note }),
  });
  await addDoc(collection(firestore, NOTICE_COLLECTION), {
    type: "status-update",
    repairId,
    createdAt: now,
    seen: false,
    title: "Status updated",
    detail: `Status changed to ${status}`,
  });
  return { ok: true };
}

export function mapRepairFromData(data: Record<string, unknown>): RepairRequest {
  return {
    id: String(data.id ?? ""),
    trackingCode: String(data.trackingCode ?? ""),
    title: {
      th: String(data.title ?? "-"),
      en: String(data.title ?? "-"),
    },
    category: {
      th: String(data.category ?? "-"),
      en: String(data.category ?? "-"),
    },
    detail: String(data.detail ?? ""),
    status: (data.status as RepairStatus) ?? "received",
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    preferredDate: String(data.preferredDate ?? ""),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    vehicleModel: String(data.vehicleModel ?? ""),
    serialNumber: data.serialNumber ? String(data.serialNumber) : undefined,
    assignedTechnician: data.assignedTechnician
      ? String(data.assignedTechnician)
      : undefined,
    contactName: data.contactName ? String(data.contactName) : undefined,
    contactPhone: data.contactPhone ? String(data.contactPhone) : undefined,
    contactEmail: data.contactEmail ? String(data.contactEmail) : undefined,
    attachments: (data.attachments as RepairRequest["attachments"]) ?? [],
    timeline: (data.timeline as RepairRequest["timeline"]) ?? [],
  };
}
