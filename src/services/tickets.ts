"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { uploadLocalFiles } from "@/lib/uploads/client";
import { getCurrentProfile, isStaff } from "@/lib/security";
import type {
  Ticket,
  TicketAttachment,
  TicketCreateInput,
  TicketStatus,
} from "@/types/ticket";

const TICKET_COLLECTION = "tickets";
const NOTIFICATION_COLLECTION = "notifications";

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

function generateReadableNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `BC-${year}${month}-${suffix}`;
}

async function uploadAttachments(
  files: File[],
  onProgress?: (value: number) => void,
) {
  if (!files.length) {
    return [];
  }
  const results = await uploadLocalFiles(files, "tickets", onProgress);
  return results.map((file) => ({
    url: file.url,
    path: file.path,
    type: file.type,
    name: file.name,
  })) as TicketAttachment[];
}

export async function createTicket(
  input: TicketCreateInput,
  files: File[],
  onProgress?: (value: number) => void,
) {
  if (!ensureFirebase()) {
    // Mock success for demo - save to localStorage
    return new Promise<{ ok: boolean; id?: string; readableNo?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        const id = "mock-" + Math.random().toString(36).slice(2, 9);
        const readableNo = generateReadableNo();
        const now = new Date().toISOString();
        const user = auth?.currentUser;

        const newTicket: Ticket = {
          id,
          readableNo,
          userId: user?.uid || "mock-user",
          title: input.title,
          category: input.category,
          description: input.description,
          vehicleId: input.vehicleId,
          repairDate: input.repairDate,
          status: "NEW",
          attachments: [], // images are harder to mock in localStorage without heavy base64
          timeline: [{ status: "NEW", at: now, by: user?.uid || "mock-user" }],
          createdAt: now,
          updatedAt: now,
        };

        if (typeof window !== "undefined") {
          const key = `bc_mock_tickets_${user?.uid || "mock-user"}`;
          const current = JSON.parse(localStorage.getItem(key) || "[]");
          localStorage.setItem(key, JSON.stringify([newTicket, ...current]));
        }

        resolve({ ok: true, id, readableNo });
      }, 1000);
    });
  }

  const user = ensureUser();
  if (!user) {
    return { ok: false, error: "Authentication is required." };
  }

  try {
    const firestore = db as Firestore;
    const profileSnap = await getDoc(doc(firestore, "users", user.uid));
    const profile = profileSnap.exists()
      ? (profileSnap.data() as {
        address?: {
          line1?: string;
          district?: string;
          province?: string;
          zip?: string;
        };
      })
      : null;
    const address = profile?.address;
    const hasAddress =
      !!address &&
      [address.line1, address.district, address.province, address.zip].every(
        (value) => typeof value === "string" && value.trim().length > 0,
      );
    if (!hasAddress) {
      return {
        ok: false,
        error: "Please update your address before submitting a ticket.",
      };
    }

    const now = new Date().toISOString();
    const readableNo = generateReadableNo();

    const docRef = await addDoc(collection(firestore, TICKET_COLLECTION), {
      ...input,
      readableNo,
      userId: user.uid,
      status: "NEW",
      assignedTo: null,
      attachments: [],
      timeline: [{ status: "NEW", at: now, by: user.uid }],
      createdAt: now,
      updatedAt: now,
    });

    const attachments = await uploadAttachments(files, onProgress);
    if (attachments.length) {
      await updateDoc(doc(firestore, TICKET_COLLECTION, docRef.id), {
        attachments,
        updatedAt: new Date().toISOString(),
      });
    }

    await addDoc(collection(firestore, NOTIFICATION_COLLECTION), {
      type: "new-ticket",
      ticketId: docRef.id,
      toRole: "technician",
      title: "New ticket",
      message: `New ticket ${readableNo}`,
      link: `/bo/tickets/${docRef.id}`,
      read: false,
      createdAt: now,
    });

    return { ok: true, id: docRef.id, readableNo };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create ticket.";
    return { ok: false, error: message };
  }
}

export function subscribeTicketsForUser(
  userId: string,
  onChange: (tickets: Ticket[]) => void,
  onError?: (error: Error) => void,
) {
  if (!ensureFirebase()) {
    // Read from localStorage for demo
    const read = () => {
      const key = `bc_mock_tickets_${userId}`;
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      // Add a static example if empty just to show it works
      if (items.length === 0) {
        const now = new Date().toISOString();
        const example: Ticket = {
          id: "mock-sample",
          readableNo: "BC-SAMPLE-001",
          userId,
          title: "รถจำลองตัวอย่าง",
          category: "repair",
          description: "ตัวอย่างงานแจ้งซ่อมในเครื่อง",
          status: "NEW",
          attachments: [],
          timeline: [{ status: "NEW", at: now, by: userId }],
          createdAt: now,
          updatedAt: now,
        };
        return [example];
      }
      return items;
    };

    onChange(read());
    const interval = setInterval(() => onChange(read()), 2000);
    return () => clearInterval(interval);
  }

  const firestore = db as Firestore;
  const ticketQuery = query(
    collection(firestore, TICKET_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    ticketQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        mapTicketFromData({ id: docSnap.id, ...docSnap.data() }),
      );
      onChange(items);
    },
    (error) => onError?.(error),
  );
}

export function subscribeTickets(
  onChange: (tickets: Ticket[]) => void,
  onError?: (error: Error) => void,
) {
  if (!ensureFirebase()) {
    // Mock for backoffice demo
    const now = new Date().toISOString();
    const mockTickets: Ticket[] = [
      {
        id: "mock-1",
        readableNo: "BC-6701-001",
        userId: "user-1",
        title: "รถรุ่น BC-100 สตาร์ทไม่ติด",
        category: "repair",
        description: "แบตเตอรี่อาจจะหมดครับ",
        status: "NEW",
        attachments: [],
        timeline: [{ status: "NEW", at: now, by: "user-1" }],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "mock-2",
        readableNo: "BC-6701-002",
        userId: "user-2",
        title: "เปลี่ยนยางรถรุ่น BC-250",
        category: "repair",
        description: "ยางหน้าแบนครับ",
        status: "CHECKING",
        attachments: [],
        timeline: [
          { status: "NEW", at: now, by: "user-2" },
          { status: "CHECKING", at: now, by: "staff-1" },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
    onChange(mockTickets);
    return () => { };
  }

  let cancelled = false;
  (async () => {
    const profile = await getCurrentProfile();
    if (!profile || !isStaff(profile.role)) {
      onError?.(new Error("No backoffice access."));
      cancelled = true;
      return;
    }
    if (cancelled) return;
    const firestore = db as Firestore;
    const ticketQuery = query(
      collection(firestore, TICKET_COLLECTION),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      ticketQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          mapTicketFromData({ id: docSnap.id, ...docSnap.data() }),
        );
        onChange(items);
      },
      (error) => onError?.(error),
    );
  })();

  return () => {
    cancelled = true;
  };
}

export function subscribeTicketById(
  ticketId: string,
  onChange: (ticket: Ticket | null) => void,
  onError?: (error: Error) => void,
) {
  if (!ensureFirebase()) {
    // Mock find in localStorage for demo
    const user = auth?.currentUser;
    const find = () => {
      const key = `bc_mock_tickets_${user?.uid || "mock-user"}`;
      const items = JSON.parse(localStorage.getItem(key) || "[]") as Ticket[];
      const found = items.find(t => t.id === ticketId || t.readableNo === ticketId);
      if (found) return found;

      // Still fallback to generating one if it's the "mock-sample" or matching our search
      if (ticketId === "mock-sample") {
        const now = new Date().toISOString();
        return {
          id: "mock-sample",
          readableNo: "BC-SAMPLE-001",
          userId: user?.uid || "mock-user",
          title: "รถจำลองตัวอย่าง",
          category: "repair",
          description: "ตัวอย่างงานแจ้งซ่อมในเครื่อง",
          status: "NEW" as TicketStatus,
          attachments: [],
          timeline: [{ status: "NEW" as TicketStatus, at: now, by: user?.uid || "mock-user" }],
          createdAt: now,
          updatedAt: now,
        } as Ticket;
      }
      return null;
    };

    onChange(find());
    const interval = setInterval(() => onChange(find()), 2000);
    return () => clearInterval(interval);
  }

  let cancelled = false;
  (async () => {
    const profile = await getCurrentProfile();
    if (!profile) {
      onError?.(new Error("Authentication is required."));
      cancelled = true;
      return;
    }
    const firestore = db as Firestore;
    let ticketRef = doc(firestore, TICKET_COLLECTION, ticketId);
    let ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) {
      // Fallback: allow lookup by readableNo slug
      const fallbackQuery = query(
        collection(firestore, TICKET_COLLECTION),
        where("readableNo", "==", ticketId),
      );
      const fallbackSnap = await getDocs(fallbackQuery);
      const first = fallbackSnap.docs[0];
      if (first) {
        ticketRef = doc(firestore, TICKET_COLLECTION, first.id);
        ticketSnap = await getDoc(ticketRef);
      } else {
        onChange(null);
        cancelled = true;
        return;
      }
    }
    const ticketData = mapTicketFromData({
      id: ticketSnap.id,
      ...ticketSnap.data(),
    });
    if (!isStaff(profile.role) && ticketData.userId !== profile.uid) {
      onError?.(new Error("No permission to view this ticket."));
      cancelled = true;
      return;
    }
    if (cancelled) return;
    return onSnapshot(
      ticketRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onChange(null);
          return;
        }
        onChange(mapTicketFromData({ id: snapshot.id, ...snapshot.data() }));
      },
      (error) => onError?.(error),
    );
  })();

  return () => {
    cancelled = true;
  };
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  note?: string,
  assignedTo?: string | null,
) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const user = ensureUser();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status,
    updatedAt: now,
    timeline: arrayUnion({
      status,
      at: now,
      by: user?.uid,
      note,
    }),
  };
  if (assignedTo !== undefined) {
    payload.assignedTo = assignedTo;
  }
  const firestore = db as Firestore;
  await updateDoc(doc(firestore, TICKET_COLLECTION, ticketId), payload);
  return { ok: true };
}

export async function deleteTicket(ticketId: string) {
  if (!ensureFirebase()) {
    const user = auth?.currentUser;
    const uid = user?.uid || "mock-user";
    const key = `bc_mock_tickets_${uid}`;
    const items = JSON.parse(localStorage.getItem(key) || "[]") as Ticket[];
    const filtered = items.filter((item) => item.id !== ticketId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return { ok: true };
  }

  const user = ensureUser();
  if (!user) {
    return { ok: false, error: "Authentication is required." };
  }

  try {
    const firestore = db as Firestore;
    const docRef = doc(firestore, TICKET_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      return { ok: false, error: "Ticket not found." };
    }

    const data = snap.data();
    if (data.userId !== user.uid) {
      // Check if staff
      const profileSnap = await getDoc(doc(firestore, "users", user.uid));
      const profile = profileSnap.data() as any;
      if (profile?.role !== "admin" && profile?.role !== "technician") {
        return { ok: false, error: "No permission to delete this ticket." };
      }
    }

    // In a real app we might want to delete attachments too, but for now we delete the doc
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(docRef);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete ticket.";
    return { ok: false, error: message };
  }
}

export async function assignTicketToSelf(ticketId: string) {
  const user = ensureUser();
  if (!user) {
    return { ok: false, error: "Authentication is required." };
  }
  return updateTicketStatus(ticketId, "CHECKING", undefined, user.uid);
}

export async function getTicketById(ticketId: string) {
  if (!ensureFirebase()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const firestore = db as Firestore;
  const snap = await getDoc(doc(firestore, TICKET_COLLECTION, ticketId));
  if (!snap.exists()) {
    return { ok: false, error: "Ticket not found." };
  }
  return { ok: true, data: mapTicketFromData({ id: snap.id, ...snap.data() }) };
}

export function mapTicketFromData(data: Record<string, unknown>): Ticket {
  return {
    id: String(data.id ?? ""),
    readableNo: String(data.readableNo ?? ""),
    userId: String(data.userId ?? ""),
    title: String(data.title ?? ""),
    category: String(data.category ?? ""),
    description: String(data.description ?? ""),
    vehicleId: data.vehicleId ? String(data.vehicleId) : undefined,
    repairDate: data.repairDate ? String(data.repairDate) : undefined,
    attachments: (data.attachments as TicketAttachment[]) ?? [],
    status: (data.status as TicketStatus) ?? "NEW",
    assignedTo: (data.assignedTo as string | null | undefined) ?? null,
    timeline: (data.timeline as Ticket["timeline"]) ?? [],
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}
