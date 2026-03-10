"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import PageHeader from "@/components/sections/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { formatDateTime, formatDate } from "@/lib/format";
import type { UserProfile } from "@/types/user";
import type { Ticket } from "@/types/ticket";
import type { TranslationKey } from "@/lib/i18n";

export default function BackofficeUserDetailPage() {
  const { lang, t } = useI18n();
  const params = useParams();
  const userId = String(params?.id ?? "");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");

  // Load user profile from Firestore
  useEffect(() => {
    if (!userId || !db || !isFirebaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const firestore = db as Firestore;
        const snap = await getDoc(doc(firestore, "users", userId));
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data() as Record<string, any>;
            setUser({
              id: snap.id,
              displayName: data.displayName || data.email || userId,
              email: data.email || "",
              phone: data.phone || "",
              avatarUrl: data.avatarUrl || "",
              role: data.role,
              address: data.address || { line1: "", district: "", province: "", zip: "" },
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          } else {
            setUser(null);
          }
          setUserLoaded(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setUserLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Subscribe to tickets for this user
  useEffect(() => {
    if (!userId || !db || !isFirebaseConfigured) return;
    const firestore = db as Firestore;
    const ticketQuery = query(
      collection(firestore, "tickets"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      ticketQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Ticket, "id">),
        }));
        setTickets(items);
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [userId]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!userLoaded) {
    return (
      <div className="text-sm text-[--text-soft]">
        {lang === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={lang === "th" ? "ไม่พบข้อมูลผู้ใช้" : "User not found"}
          subtitle={`UID: ${userId}`}
          backHref="/bo/tickets"
        />
        <p className="text-sm text-[--text-soft]">
          {lang === "th"
            ? "ไม่พบข้อมูลผู้ใช้รายนี้ในระบบ"
            : "This user's profile could not be found in the system."}
        </p>
      </div>
    );
  }

  const roleBadge = user.role === "admin"
    ? { label: lang === "th" ? "ผู้ดูแลระบบ" : "Admin", tone: "red" as const }
    : user.role === "technician"
    ? { label: lang === "th" ? "ช่าง" : "Technician", tone: "amber" as const }
    : { label: lang === "th" ? "ลูกค้า" : "Customer", tone: "green" as const };

  const activeTickets = tickets.filter((t) =>
    ["NEW", "CHECKING", "IN_PROGRESS"].includes(t.status)
  );
  const doneTickets = tickets.filter((t) =>
    ["DONE", "CANCELLED"].includes(t.status)
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={user.displayName}
        subtitle={`${lang === "th" ? "โปรไฟล์ลูกค้า" : "Customer Profile"} - ${user.email}`}
        backHref="/bo/tickets"
      />

      {/* Profile card */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-20 w-20 rounded-2xl object-cover border border-emerald-100"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[--text-strong]">{user.displayName}</h2>
              <Badge tone={roleBadge.tone}>{roleBadge.label}</Badge>
            </div>
            <div className="grid gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[--text-soft] w-16">Email</span>
                <a href={`mailto:${user.email}`} className="text-emerald-700 hover:underline">
                  {user.email}
                </a>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[--text-soft] w-16">
                    {lang === "th" ? "โทร" : "Phone"}
                  </span>
                  <a href={`tel:${user.phone}`} className="text-emerald-700 hover:underline">
                    {user.phone}
                  </a>
                </div>
              )}
              {user.address?.line1 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-[--text-soft] w-16 mt-0.5">
                    {lang === "th" ? "ที่อยู่" : "Address"}
                  </span>
                  <span className="text-[--text-mid] text-xs leading-relaxed">
                    {user.address.line1}
                    {user.address.district ? `, ${user.address.district}` : ""}
                    {user.address.province ? `, ${user.address.province}` : ""}
                    {user.address.zip ? ` ${user.address.zip}` : ""}
                  </span>
                </div>
              )}
              {(user as any).createdAt && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[--text-soft] w-16">
                    {lang === "th" ? "สมัครเมื่อ" : "Joined"}
                  </span>
                  <span className="text-xs text-[--text-soft]">
                    {formatDateTime((user as any).createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 border-t border-emerald-50 pt-3">
          <a href={`mailto:${user.email}`}>
            <Button size="sm" variant="outline">
              ✉️ {lang === "th" ? "ส่งอีเมล" : "Send Email"}
            </Button>
          </a>
          {user.phone && (
            <a href={`tel:${user.phone}`}>
              <Button size="sm" variant="outline">
                📞 {lang === "th" ? "โทรหาลูกค้า" : "Call Customer"}
              </Button>
            </a>
          )}
          <Link href={`/bo/tickets?userId=${userId}`}>
            <Button size="sm" variant="outline">
              🔧 {lang === "th" ? "ดูคำร้องทั้งหมด" : "All Tickets"}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Active tickets */}
      {activeTickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[--text-strong]">
            {lang === "th" ? `งานที่กำลังดำเนินการ (${activeTickets.length})` : `Active Tickets (${activeTickets.length})`}
          </h3>
          <div className="space-y-2">
            {activeTickets.map((ticket) => (
              <Link key={ticket.id} href={`/bo/tickets/${ticket.id}`}>
                <Card className="flex items-center justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="text-sm font-semibold text-[--text-strong]">{ticket.title}</div>
                    <div className="text-xs text-[--text-soft]">
                      {ticket.readableNo} · {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                  <Badge
                    tone={
                      ticket.status === "NEW"
                        ? "amber"
                        : ticket.status === "IN_PROGRESS"
                        ? "green"
                        : "green"
                    }
                  >
                    {t(`status.${ticket.status}` as TranslationKey)}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Done tickets */}
      {doneTickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[--text-mid]">
            {lang === "th" ? `ประวัติการซ่อม (${doneTickets.length})` : `Repair History (${doneTickets.length})`}
          </h3>
          <div className="space-y-2">
            {doneTickets.map((ticket) => (
              <Link key={ticket.id} href={`/bo/tickets/${ticket.id}`}>
                <Card className="flex items-center justify-between hover:shadow-sm transition-all opacity-80">
                  <div>
                    <div className="text-sm font-semibold text-[--text-strong]">{ticket.title}</div>
                    <div className="text-xs text-[--text-soft]">
                      {ticket.readableNo} · {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                  <Badge tone={ticket.status === "DONE" ? "gray" : "red"}>
                    {t(`status.${ticket.status}` as TranslationKey)}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="text-sm text-[--text-soft]">
          {lang === "th" ? "ลูกค้ารายนี้ยังไม่เคยแจ้งซ่อม" : "This customer has no tickets yet."}
        </div>
      )}
    </div>
  );
}
