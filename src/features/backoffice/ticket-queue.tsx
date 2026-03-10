"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n-provider";
import { deleteTicket, subscribeTickets } from "@/services/tickets";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { showErrorAlert } from "@/lib/alerts";
import { formatDateTime } from "@/lib/format";
import type { Ticket } from "@/types/ticket";
import type { TranslationKey } from "@/lib/i18n";

type UserMini = {
  displayName: string;
  email: string;
  phone?: string;
};

type TicketQueueProps = {
  items?: Ticket[];
};

export default function TicketQueue({ items: initialItems }: TicketQueueProps) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Ticket[]>(initialItems ?? []);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState<Record<string, UserMini>>({});

  const handleDelete = async (ticketId: string) => {
    if (window.confirm(t("actions.deleteTicketConfirm"))) {
      const res = await deleteTicket(ticketId);
      if (!res.ok) {
        await showErrorAlert({ title: "Error", text: res.error || "Delete failed" });
      }
    }
  };

  const ticketCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((ticket) => {
      counts.set(ticket.userId, (counts.get(ticket.userId) ?? 0) + 1);
    });
    return counts;
  }, [items]);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      return;
    }
    const unsubscribe = subscribeTickets(
      (data) => {
        setItems(
          data.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED"),
        );
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [initialItems]);

  // Fetch user info for unique userIds
  useEffect(() => {
    if (!db || !isFirebaseConfigured) return;
    const uniqueIds = [...new Set(items.map((t) => t.userId))];
    uniqueIds.forEach(async (uid) => {
      if (userMap[uid]) return; // already fetched
      try {
        const firestore = db as Firestore;
        const snap = await getDoc(doc(firestore, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as Record<string, any>;
          setUserMap((prev) => ({
            ...prev,
            [uid]: {
              displayName: data.displayName || data.email || uid,
              email: data.email || "",
              phone: data.phone || "",
            },
          }));
        }
      } catch {
        // ignore
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!items.length) {
    return (
      <p className="text-sm text-[--text-soft]">
        {lang === "th" ? "ยังไม่มีรายการงาน" : "No tickets yet."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((ticket) => {
        const userInfo = userMap[ticket.userId];
        return (
          <Card key={ticket.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-sm font-semibold text-[--text-strong]">
                  {ticket.title}
                </div>
                <div className="text-xs text-[--text-soft]">
                  {ticket.readableNo} - {ticket.category}
                </div>
                {/* Customer info */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1">
                  <span className="text-xs font-medium text-[--text-mid]">
                    {lang === "th" ? "ผู้แจ้ง:" : "By:"}
                  </span>
                  <Link
                    href={`/bo/users/${ticket.userId}`}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    {userInfo?.displayName || ticket.userId}
                  </Link>
                  {userInfo?.email && (
                    <a
                      href={`mailto:${userInfo.email}`}
                      className="text-xs text-[--text-soft] hover:text-emerald-600"
                    >
                      {userInfo.email}
                    </a>
                  )}
                  {userInfo?.phone && (
                    <a
                      href={`tel:${userInfo.phone}`}
                      className="text-xs text-[--text-soft] hover:text-emerald-600"
                    >
                      {userInfo.phone}
                    </a>
                  )}
                </div>
                <div className="text-xs text-[--text-soft]">
                  {lang === "th"
                    ? `แจ้งซ่อมไปแล้ว ${ticketCounts.get(ticket.userId) ?? 1} ครั้ง`
                    : `${ticketCounts.get(ticket.userId) ?? 1} ticket(s) total`}
                </div>
                {ticket.assignedTo ? (
                  <div className="text-xs text-[--text-soft]">
                    {t("labels.assignedTo")}: {ticket.assignedTo}
                  </div>
                ) : null}
                <div className="text-xs text-[--text-soft]">
                  {formatDateTime(ticket.createdAt)}
                </div>
              </div>
              <Badge
                tone={
                  ticket.status === "DONE"
                    ? "gray"
                    : ticket.status === "CANCELLED"
                      ? "red"
                      : ticket.status === "NEW"
                        ? "amber"
                        : "green"
                }
              >
                {t(`status.${ticket.status}` as TranslationKey)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/bo/tickets/${ticket.id}`}>
                <Button size="sm" variant="outline">
                  {t("actions.viewTicket")}
                </Button>
              </Link>
              {userInfo && (
                <Link href={`/bo/users/${ticket.userId}`}>
                  <Button size="sm" variant="outline">
                    {lang === "th" ? "ดูข้อมูลลูกค้า" : "View Customer"}
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="danger"
                className="bg-rose-600 text-white hover:bg-rose-700 ml-auto"
                onClick={() => handleDelete(ticket.id)}
              >
                {t("actions.delete")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

