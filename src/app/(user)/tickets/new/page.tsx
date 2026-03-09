"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import FirebaseStatus from "@/components/firebase-status";
import TicketForm from "@/features/tickets/ticket-form";

export default function NewTicketPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("ticket.newTitle")}
        subtitle={t("ticket.newSubtitle")}
        backHref="/tickets"
        logoSrc="/logo_bc.png"
      />
      <div className="space-y-4">
        {/* <FirebaseStatus /> */}
        <TicketForm />
      </div>
    </div>
  );
}
