"use client";

import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  type Firestore,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AppNotification } from "@/types/notification";

const NOTICE_COLLECTION = "notifications";

function ensureFirebase() {
  if (!db || !isFirebaseConfigured) {
    return false;
  }
  return true;
}

export async function listTechnicianNotices(limitCount = 10) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const snapshot = await getDocs(
    query(collection(db as Firestore, NOTICE_COLLECTION), orderBy("createdAt", "desc")),
  );
  const items = snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((item) => (item as AppNotification).toRole === "technician")
    .slice(0, limitCount);
  return { ok: true, data: items };
}

export async function markNoticeSeen(noticeId: string) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  await updateDoc(doc(db as Firestore, NOTICE_COLLECTION, noticeId), { read: true });
  return { ok: true };
}
