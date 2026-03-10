"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "firebase/auth";
import PageHeader from "@/components/sections/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

export default function ProfilePasswordPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;
    
    if (!password || password.length < 6) {
      await showErrorAlert({ title: "Error", text: t("auth.passwordTooShort") });
      return;
    }

    if (password !== confirm) {
      await showErrorAlert({ title: "Error", text: t("auth.passwordMismatch") });
      return;
    }

    setLoading(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        await updatePassword(user, password);
        await showSuccessAlert({
          title: lang === "th" ? "สำเร็จ" : "Success",
          text: t("auth.passwordUpdated"),
        });
        router.push("/profile");
      } else {
        await showErrorAlert({ title: "Error", text: t("auth.socialNotAllowed") });
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/requires-recent-login") {
        msg = t("auth.reloginRequired");
      }
      await showErrorAlert({ title: "Error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("profile.changePasswordAction")}
        subtitle={t("profile.subtitle")}
        backHref="/profile"
      />
      <Card className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-[--text-soft]">{t("auth.password")}</div>
            <Input 
              type="password" 
              placeholder="********" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-[--text-soft]">{t("auth.confirmPassword")}</div>
            <Input 
              type="password" 
              placeholder="********" 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "..." : t("actions.save")}
          </Button>
          <Button variant="danger" onClick={() => router.push("/profile")} disabled={loading}>
            {t("actions.cancel")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
