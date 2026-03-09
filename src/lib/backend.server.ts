import { isFirebaseConfigured } from "./firebase/client";
import type { UserProfile } from "@/types/user";
import type { Ticket, TicketCreateInput } from "@/types/ticket";

// admin SDK helpers for the firebase-backed implementation
import { getAdminDb, getAdminAuth, isAdminConfigured } from "./firebase/admin";

// -- helper types -----------------------------------------------------------
// user data when creating/updating via backend; password is not part of
// UserProfile so we extend it here.
export type NewUserData = Partial<UserProfile> & {
  password?: string;
};

// in-memory stores for the fallback implementation
const memoryUsers: UserProfile[] = [];
const memoryTickets: Ticket[] = [];

// --- firebase-backed helpers ------------------------------------------------
async function firebaseFetchUsers(): Promise<UserProfile[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection("users").get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
}

async function firebaseCreateUser(user: NewUserData): Promise<string> {
  const auth = await getAdminAuth();
  const db = await getAdminDb();
  const record = await auth.createUser({
    email: user.email || undefined,
    displayName: user.displayName,
    password: user.password || undefined,
  } as any);
  const now = new Date().toISOString();
  const id = record.uid;
  await db.collection("users").doc(id).set({
    ...user,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function firebaseGetTickets(): Promise<Ticket[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection("tickets").get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
}

// --- memory-backed helpers --------------------------------------------------
async function memoryFetchUsers(): Promise<UserProfile[]> {
  return memoryUsers.slice();
}

async function memoryCreateUser(user: NewUserData): Promise<string> {
  const id = `mem-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  // store password directly on the object so authenticate can check it
  const record: any = {
    id,
    displayName: user.displayName || "",
    email: user.email || "",
    phone: user.phone || "",
    address: { line1: "", district: "", province: "", zip: "" },
    role: user.role || "user",
    createdAt: now,
    updatedAt: now,
    avatarUrl: user.avatarUrl,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  if (user.password) {
    record.password = user.password;
  }
  memoryUsers.push(record as UserProfile);
  return id;
}

async function memoryGetTickets(): Promise<Ticket[]> {
  return memoryTickets.slice();
}

// simple credential check for memory users
async function memoryAuthenticate(
  email: string,
  password: string,
): Promise<UserProfile | null> {
  const candidate = memoryUsers.find(
    (u) => u.email === email && (u as any).password === password,
  );
  return candidate || null;
}

// fetch profile by email or id for non-Firebase mode
async function memoryFetchProfile(identifier: { id?: string; email?: string }): Promise<UserProfile | null> {
  const { id, email } = identifier;
  if (id) {
    const u = memoryUsers.find((u) => u.id === id);
    return u || null;
  }
  if (email) {
    const u = memoryUsers.find((u) => u.email === email);
    return u || null;
  }
  return null;
}

async function memoryUpdateProfile(
  id: string,
  data: Partial<UserProfile>,
): Promise<void> {
  const idx = memoryUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("User not found");
  memoryUsers[idx] = { ...memoryUsers[idx], ...data, updatedAt: new Date().toISOString() };
}

// --- exported API -----------------------------------------------------------
interface BackendAPI {
  fetchUsers: () => Promise<UserProfile[]>;
  createUser: (user: NewUserData) => Promise<string>;
  fetchTickets: () => Promise<Ticket[]>;
  authenticate: ((email: string, password: string) => Promise<UserProfile | null>) | undefined;
  fetchProfile: (identifier: { id?: string; email?: string }) => Promise<UserProfile | null>;
  updateProfile: (id: string, data: Partial<UserProfile>) => Promise<void>;
}

// Helper functions to avoid complex conditional assignments
function getFetchUsers() {
  return isAdminConfigured ? firebaseFetchUsers : memoryFetchUsers;
}

function getCreateUser() {
  return isAdminConfigured ? firebaseCreateUser : memoryCreateUser;
}

function getFetchTickets() {
  return isAdminConfigured ? firebaseGetTickets : memoryGetTickets;
}

function getAuthenticate() {
  return isAdminConfigured ? undefined : memoryAuthenticate;
}

function getUpdateProfile() {
  return isAdminConfigured
    ? async (id: string, data: Partial<UserProfile>) => {
      const db = await getAdminDb();
      await db.collection("users").doc(id).set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    }
    : memoryUpdateProfile;
}

function getFetchProfile() {
  return isAdminConfigured
    ? async (identifier: { id?: string; email?: string }) => {
      const db = await getAdminDb();
      if (identifier.id) {
        const docRef = db.collection("users").doc(identifier.id);
        const doc = await docRef.get();
        return doc.exists ? (doc.data() as UserProfile) : null;
      }
      if (identifier.email) {
        const q = await db
          .collection("users")
          .where("email", "==", identifier.email)
          .limit(1)
          .get();
        return q.empty ? null : (q.docs[0].data() as UserProfile);
      }
      return null;
    }
    : memoryFetchProfile;
}

export const backend: BackendAPI = {
  fetchUsers: getFetchUsers(),
  createUser: getCreateUser(),
  fetchTickets: getFetchTickets(),
  authenticate: getAuthenticate(),
  updateProfile: getUpdateProfile(),
  fetchProfile: getFetchProfile(),
};
