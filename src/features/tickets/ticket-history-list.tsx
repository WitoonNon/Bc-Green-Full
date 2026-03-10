"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { deleteTicket } from "@/services/tickets";
import { showErrorAlert } from "@/lib/alerts";
import type { TranslationKey } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { Ticket } from "@/types/ticket";

type TicketHistoryListProps = {
  items: Ticket[];
};

export default function TicketHistoryList({ items }: TicketHistoryListProps) {
  const { t } = useI18n();

  const handleDelete = async (e: React.MouseEvent, ticketId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(t("actions.deleteTicketConfirm"))) {
      const res = await deleteTicket(ticketId);
      if (!res.ok) {
        await showErrorAlert({ title: "Error", text: res.error || "Delete failed" });
      }
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((ticket) => {
        const categoryLabel =
          ticket.category === "repair" ? t("nav.repair") : ticket.category;
        return (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
            <Card className="relative space-y-2 transition hover:-translate-y-1">
              <button
                onClick={(e) => handleDelete(e, ticket.id)}
                className="absolute right-3 top-3 px-1.5 py-0.5 text-[9px] uppercase font-bold text-white bg-rose-500 rounded hover:bg-rose-600 transition-colors z-10"
                title={t("actions.delete")}
              >
                {t("actions.delete")}
              </button>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <h3 className="text-base font-semibold text-[--text-strong]">
                    {ticket.title}
                  </h3>
                  <p className="text-xs text-[--text-soft]">
                    {categoryLabel} - {ticket.readableNo}
                  </p>
                </div>
                <Badge tone={ticket.status === "DONE" ? "green" : "gray"}>
                  {t(`status.${ticket.status}` as TranslationKey)}
                </Badge>
              </div>
              <p className="text-xs text-[--text-mid]">
                {formatDateTime(ticket.createdAt)} - {formatDateTime(ticket.updatedAt)}
              </p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
