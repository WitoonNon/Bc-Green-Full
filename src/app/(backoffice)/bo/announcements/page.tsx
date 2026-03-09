"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import AnnouncementManager from "@/features/backoffice/announcement-manager";

export default function BackofficeAnnouncementsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("backoffice.announcements")}
        subtitle={t("backoffice.subtitle")}
        backHref="/bo/dashboard"
      />
      <AnnouncementManager />
    </div>
  );
}
