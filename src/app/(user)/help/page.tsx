"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import SupportCards from "@/features/support/support-cards";

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader title={t("support.title")} subtitle={t("support.subtitle")} />
      <SupportCards />
    </div>
  );
}
