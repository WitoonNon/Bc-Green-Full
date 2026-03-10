import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.replace(/^["']|["']$/g, '');
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.replace(/^["']|["']$/g, '');
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/^["']|["']$/g, '')?.replace(/\\n/g, "\n");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^["']|["']$/g, '');

export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);

if (!isAdminConfigured) {
  console.warn(
    "FIREBASE ADMIN NOT CONFIGURED: User/Vehicle management will use local mock storage instead of real Firebase.",
  );
}

function getAdminApp() {
  if (!getApps().length) {
    if (!isAdminConfigured) {
      throw new Error("Firebase Admin is not configured.");
    }
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  }
  return getApps()[0];
}


export async function getAdminAuth() {
  // Marked async to satisfy Next server action expectations even though sync.
  return getAuth(getAdminApp());
}

export async function getAdminDb() {
  // Marked async to satisfy Next server action expectations even though sync.
  return getFirestore(getAdminApp());
}

export async function getAdminStorage() {
  return getStorage(getAdminApp());
}
