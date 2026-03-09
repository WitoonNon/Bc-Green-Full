"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import FaqManager from "@/features/backoffice/faq-manager";

export default function BackofficeFaqPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("support.faq")}
        subtitle={t("backoffice.help")}
        backHref="/bo/dashboard"
      />
      <FaqManager />
    </div>
  );
}
