"use client";

import Link from "next/link";
import PageHeader from "@/components/sections/page-header";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import ProfileForm from "@/features/profile/profile-form";

export default function ProfilePage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/profile/edit">
          <Card className="p-4 text-sm font-semibold text-[--text-strong]">
            {t("profile.editNameAction")} / {t("profile.editAddressAction")}
          </Card>
        </Link>
        <Link href="/profile/password">
          <Card className="p-4 text-sm font-semibold text-[--text-strong]">
            {t("profile.changePasswordAction")}
          </Card>
        </Link>
      </div>
      <ProfileForm />
    </div>
  );
}
