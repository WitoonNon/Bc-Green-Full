"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import VehicleManager from "@/features/backoffice/vehicle-manager";

export default function BackofficeVehiclesPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("backoffice.vehicles")}
        subtitle={t("backoffice.subtitle")}
        backHref="/bo/dashboard"
      />
      <VehicleManager />
    </div>
  );
}
