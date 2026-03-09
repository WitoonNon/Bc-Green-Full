"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/sections/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import FirebaseStatus from "@/components/firebase-status";
import TicketStatusCard from "@/features/tickets/ticket-status-card";
import TicketHistoryList from "@/features/tickets/ticket-history-list";
import { subscribeTicketsForUser } from "@/services/tickets";
import type { Ticket } from "@/types/ticket";

const ACTIVE_STATUSES: Ticket["status"][] = ["NEW", "CHECKING", "IN_PROGRESS"];

export default function TicketStatusPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"active" | "history">("active");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) {
      return;
    }
    const unsubscribe = subscribeTicketsForUser(
      user.uid,
      (items) => setTickets(items),
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return tickets.filter((ticket) => {
      return (
        ticket.readableNo.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q)
      );
    });
  }, [tickets, query]);

  const activeTickets = filtered.filter((ticket) =>
    ACTIVE_STATUSES.includes(ticket.status),
  );
  const historyTickets = filtered.filter(
    (ticket) => !ACTIVE_STATUSES.includes(ticket.status),
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t("status.title")} subtitle={t("status.subtitle")} />
      {/* <FirebaseStatus /> */}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <SearchInput
        placeholder={t("fields.search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title={view === "active" ? t("status.current") : t("status.history")}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === "active" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("active")}
          >
            {t("status.current")}
          </Button>
          <Button
            type="button"
            variant={view === "history" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("history")}
          >
            {t("status.history")}
          </Button>
          <Link href="/tickets/new" className="inline-flex">
            <Button type="button" variant="outline" size="sm">
              {t("nav.repair")}
            </Button>
          </Link>
        </div>
      </div>
      {view === "active" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeTickets.length ? (
            activeTickets.map((ticket) => (
              <TicketStatusCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <p className="text-sm text-[--text-soft]">
              {lang === "th"
                ? "ไม่พบงานที่กำลังดำเนินการ"
                : "No active tickets."}
            </p>
          )}
        </div>
      ) : (
        historyTickets.length ? (
          <TicketHistoryList items={historyTickets} />
        ) : (
          <p className="text-sm text-[--text-soft]">
            {lang === "th" ? "ยังไม่มีประวัติการแจ้งซ่อม" : "No ticket history yet."}
          </p>
        )
      )}
    </div>
  );
}
