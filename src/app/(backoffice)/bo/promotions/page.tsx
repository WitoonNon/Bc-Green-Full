"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import PromotionManager from "@/features/backoffice/promotion-manager";

export default function BackofficePromotionsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("backoffice.promotions")}
        subtitle={t("backoffice.subtitle")}
        backHref="/bo/dashboard"
      />
      <PromotionManager />
    </div>
  );
}
