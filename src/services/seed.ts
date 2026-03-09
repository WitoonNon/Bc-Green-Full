"use client";

import {
  doc,
  getDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { announcements } from "@/data/announcements";
import { promotions } from "@/data/promotions";
import { faqs, manuals } from "@/data/support";
import { vehicles } from "@/data/vehicles";

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

async function shouldCreateDoc(collectionName: string, docId: string) {
  if (!db) {
    return false;
  }
  const firestore = db as Firestore;
  const snap = await getDoc(doc(firestore, collectionName, docId));
  return !snap.exists();
}

export async function seedCollections() {
  if (!db || !auth || !isFirebaseConfigured) {
    return { ok: false, error: "Firebase is not configured." };
  }

  const user = ensureUser();
  if (!user) {
    return { ok: false, error: "Authentication is required." };
  }

  const firestore = db as Firestore;
  const bootstrapRef = doc(firestore, "system", "bootstrap");
  const bootstrapSnap = await getDoc(bootstrapRef);
  if (bootstrapSnap.exists()) {
    return { ok: true, seeded: false };
  }

  const batch = writeBatch(firestore);
  const now = new Date().toISOString();

  for (const item of promotions) {
    if (await shouldCreateDoc("promotions", item.id)) {
      batch.set(doc(firestore, "promotions", item.id), { ...item, seed: true, createdAt: now });
    }
  }

  for (const item of announcements) {
    if (await shouldCreateDoc("announcements", item.id)) {
      batch.set(doc(firestore, "announcements", item.id), { ...item, seed: true, createdAt: now });
    }
  }

  for (const item of manuals) {
    if (await shouldCreateDoc("manuals", item.id)) {
      batch.set(doc(firestore, "manuals", item.id), {
        ...item,
        published: true,
        seed: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (const item of faqs) {
    if (await shouldCreateDoc("faqs", item.id)) {
      batch.set(doc(firestore, "faqs", item.id), {
        ...item,
        published: true,
        seed: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (const item of vehicles) {
    if (await shouldCreateDoc("vehicles", item.id)) {
      batch.set(doc(firestore, "vehicles", item.id), {
        ...item,
        published: true,
        seed: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  batch.set(bootstrapRef, {
    seeded: true,
    seededAt: now,
    seededBy: user.uid,
  });

  await batch.commit();
  return { ok: true, seeded: true };
}
