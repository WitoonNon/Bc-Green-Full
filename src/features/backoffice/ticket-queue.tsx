"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n-provider";
import { subscribeTickets } from "@/services/tickets";
import type { Ticket } from "@/types/ticket";
import type { TranslationKey } from "@/lib/i18n";

type TicketQueueProps = {
  items?: Ticket[];
};

export default function TicketQueue({ items: initialItems }: TicketQueueProps) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Ticket[]>(initialItems ?? []);
  const [error, setError] = useState("");

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
      {items.map((ticket) => (
        <Card key={ticket.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[--text-strong]">
                {ticket.title}
              </div>
              <div className="text-xs text-[--text-soft]">
                {ticket.readableNo} - {ticket.category}
              </div>
              <div className="text-xs text-[--text-soft]">
                {lang === "th"
                  ? `ผู้ใช้งานรายนี้แจ้งซ่อม ${ticketCounts.get(ticket.userId) ?? 1} ครั้ง`
                  : `This user has ${ticketCounts.get(ticket.userId) ?? 1} tickets`}
              </div>
              {ticket.assignedTo ? (
                <div className="text-xs text-[--text-soft]">
                  {t("labels.assignedTo")}: {ticket.assignedTo}
                </div>
              ) : null}
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
          </div>
        </Card>
      ))}
    </div>
  );
}
