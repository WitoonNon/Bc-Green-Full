"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import FaqList from "@/features/support/faq-list";

export default function HelpFaqPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("support.faq")}
        subtitle={t("support.subtitle")}
        backHref="/help"
      />
      <FaqList />
    </div>
  );
}
