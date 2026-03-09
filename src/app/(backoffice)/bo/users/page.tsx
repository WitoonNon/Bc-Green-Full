"use client";

import PageHeader from "@/components/sections/page-header";
import { useI18n } from "@/components/i18n-provider";
import UserManager from "@/features/backoffice/user-manager";

export default function BackofficeUsersPage() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={lang === "th" ? "จัดการผู้ใช้งาน" : "User management"}
        subtitle={t("backoffice.subtitle")}
        backHref="/bo/dashboard"
      />
      <UserManager />
    </div>
  );
}
