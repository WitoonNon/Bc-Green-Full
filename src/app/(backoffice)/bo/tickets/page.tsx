"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/sections/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/components/i18n-provider";
import TicketQueue from "@/features/backoffice/ticket-queue";
import { subscribeTickets } from "@/services/tickets";
import type { Ticket, TicketStatus } from "@/types/ticket";
import type { TranslationKey } from "@/lib/i18n";

const statusOptions: Array<"ALL" | TicketStatus> = [
  "ALL",
  "NEW",
  "CHECKING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export default function BackofficeTicketsPage() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | TicketStatus>("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeTickets(
      (data) => setTickets(data),
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return tickets.filter((ticket) => {
      if (userIdParam && ticket.userId !== userIdParam) {
        return false;
      }
      const matchQuery =
        ticket.readableNo.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q);
      const matchStatus = status === "ALL" || ticket.status === status;
      return matchQuery && matchStatus;
    });
  }, [tickets, query, status, userIdParam]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("backoffice.tickets")}
        subtitle={t("backoffice.subtitle")}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <SearchInput
          placeholder={t("fields.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value as "ALL" | TicketStatus)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "ALL"
                ? t("actions.viewAll")
                : t(`status.${option}` as TranslationKey)}
            </option>
          ))}
        </Select>
      </div>
      <TicketQueue items={filtered} />
    </div>
  );
}
