"use client";

import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
  where,
  type Firestore,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AppNotification } from "@/types/notification";

const NOTIFICATION_COLLECTION = "notifications";

function ensureFirebase() {
  if (!db || !isFirebaseConfigured) {
    return false;
  }
  return true;
}

export function subscribeNotificationsForRole(
  role: "technician" | "admin" | "user",
  onChange: (items: AppNotification[]) => void,
  onError?: (error: Error) => void,
) {
  if (!ensureFirebase()) {
    onError?.(new Error("Firebase is not configured."));
    return () => { };
  }
  const notificationQuery = query(
    collection(db as Firestore, NOTIFICATION_COLLECTION),
    where("toRole", "==", role),
  );

  return onSnapshot(
    notificationQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AppNotification, "id">),
      }));
      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      onChange(items);
    },
    (error) => onError?.(error),
  );
}

export async function markNotificationRead(notificationId: string) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  await updateDoc(doc(db as Firestore, NOTIFICATION_COLLECTION, notificationId), {
    read: true,
  });
  return { ok: true };
}
