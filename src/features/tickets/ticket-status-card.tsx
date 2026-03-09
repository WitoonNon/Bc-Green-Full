"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusStepper } from "@/components/ui/status-stepper";
import { useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { Ticket, TicketStatus } from "@/types/ticket";

type TicketStatusCardProps = {
  ticket: Ticket;
};

const statusRank: Record<TicketStatus, number> = {
  NEW: 1,
  CHECKING: 2,
  IN_PROGRESS: 3,
  DONE: 4,
  CANCELLED: 4,
};

export default function TicketStatusCard({ ticket }: TicketStatusCardProps) {
  const { t } = useI18n();
  const categoryLabel =
    ticket.category === "repair" ? t("nav.repair") : ticket.category;
  const steps: { key: TicketStatus; label: string }[] = [
    { key: "NEW", label: t("status.NEW") },
    { key: "CHECKING", label: t("status.CHECKING") },
    { key: "IN_PROGRESS", label: t("status.IN_PROGRESS") },
    { key: "DONE", label: t("status.DONE") },
  ];

  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <Card className="space-y-4 transition hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[--text-strong]">
              {ticket.title}
            </h3>
            <p className="text-xs text-[--text-soft]">
              {categoryLabel} - {ticket.readableNo}
            </p>
          </div>
          <Badge>{t(`status.${ticket.status}` as TranslationKey)}</Badge>
        </div>
        <StatusStepper current={ticket.status} steps={steps} rank={statusRank} />
        <div className="rounded-2xl border border-emerald-200 bg-white/70 p-3 text-xs text-[--text-mid]">
          <div className="font-semibold">{t("status.timeline")}</div>
          <div className="mt-2 space-y-1">
            {ticket.timeline.map((entry) => (
              <div key={`${entry.status}-${entry.at}`}>
                <span className="font-semibold">
                  {t(`status.${entry.status}` as TranslationKey)}
                </span>{" "}
                - {formatDateTime(entry.at)}
                {entry.note ? ` - ${entry.note}` : ""}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
