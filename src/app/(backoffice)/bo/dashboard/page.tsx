"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import NotificationList from "@/features/backoffice/notification-list";
import SeedPanel from "@/features/backoffice/seed-panel";
import TicketQueue from "@/features/backoffice/ticket-queue";

export default function BackofficeDashboardPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("backoffice.title")}
        subtitle={t("backoffice.subtitle")}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[--text-strong]">
              {t("backoffice.notices")}
            </h2>
            <NotificationList />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[--text-strong]">
              {t("backoffice.seedTitle")}
            </h2>
            <SeedPanel />
          </section>
        </div>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[--text-strong]">
            {t("backoffice.openRepairs")}
          </h2>
          <TicketQueue />
        </section>
      </div>
    </div>
  );
}
