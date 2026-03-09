"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import ManualManager from "@/features/backoffice/manual-manager";

export default function BackofficeManualPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("support.manuals")}
        subtitle={t("backoffice.help")}
        backHref="/bo/dashboard"
      />
      <ManualManager />
    </div>
  );
}
