"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type ResetMessage = {
  type: "error" | "success";
  text: string;
};

export default function ForgotPasswordPage() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<ResetMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setMessage(null);
    if (!isFirebaseConfigured || !auth) {
      setMessage({
        type: "error",
        text: "Firebase is not configured.",
      });
      await showErrorAlert({ title: "Error", text: "Firebase is not configured." });
      return;
    }
    if (!email) {
      setMessage({
        type: "error",
        text: lang === "th" ? "กรุณากรอกอีเมล" : "Please enter your email.",
      });
      await showErrorAlert({
        title: "Error",
        text: lang === "th" ? "กรุณากรอกอีเมล" : "Please enter your email.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: "success",
        text:
          lang === "th"
            ? "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว"
            : "Password reset link sent.",
      });
      await showSuccessAlert({
        title:
          lang === "th"
            ? "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว"
            : "Password reset link sent.",
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Reset failed";
      setMessage({ type: "error", text: messageText });
      await showErrorAlert({ title: "Error", text: messageText });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_rgba(224,246,200,0.95))] px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-[--text-strong]">
              {t("auth.resetTitle")}
            </h2>
            <p className="text-sm text-[--text-soft]">
              {t("auth.resetSubtitle")}
            </p>
          </div>
          <Input
            type="email"
            value={email}
            placeholder={t("auth.email")}
            onChange={(event) => setEmail(event.target.value)}
          />
          {message ? (
            <div
              className={
                message.type === "error"
                  ? "text-xs text-rose-600"
                  : "text-xs text-emerald-700"
              }
            >
              {message.text}
            </div>
          ) : null}
          <Button className="w-full" onClick={handleReset} disabled={submitting}>
            {submitting ? "..." : t("actions.send")}
          </Button>
          <Link href="/login" className="text-xs font-semibold text-emerald-700">
            {t("actions.back")}
          </Link>
        </Card>
      </div>
    </div>
  );
}
