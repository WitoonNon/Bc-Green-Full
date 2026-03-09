"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type AuthMessage = {
  type: "error" | "success";
  text: string;
};

function BackofficeLoginInner() {
  const { t, lang } = useI18n();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/bo/dashboard",
    [searchParams],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && !user.isAnonymous) {
      router.replace(nextPath);
    }
  }, [loading, user, router, nextPath]);

  const handleAuth = async () => {
    setMessage(null);

    if (!email || !password) {
      const text = t("auth.fillAllFields");
      setMessage({ type: "error", text });
      await showErrorAlert({ title: "Error", text });
      return;
    }

    try {
      setSubmitting(true);

      if (!isFirebaseConfigured || !auth) {
        // Mock backoffice login for demo
        setSessionCookie("1");
        setMessage({ type: "success", text: t("auth.loginSuccess") });
        await showSuccessAlert({
          title: t("auth.loginSuccess"),
          text: lang === "th" ? "เข้าสู่ระบบโหมดจำลองแอดมินสำเร็จ" : "Backoffice demo login success."
        });
        window.location.href = nextPath;
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user?.uid;
      if (!uid || !db) {
        const text = "Firebase is not configured.";
        setMessage({ type: "error", text });
        await showErrorAlert({ title: "Error", text });
        return;
      }
      const firestore = db as Firestore;
      const snap = await getDoc(doc(firestore, "users", uid));
      const role = snap.data()?.role as "admin" | "technician" | "user" | undefined;
      if (role !== "admin" && role !== "technician") {
        const text =
          lang === "th"
            ? "บัญชีนี้ไม่มีสิทธิ์เข้าหน้าช่าง/แอดมิน"
            : "This account does not have backoffice access.";
        setMessage({ type: "error", text });
        await showErrorAlert({ title: "Error", text });
        await signOut();
        return;
      }
      setSessionCookie("1");
      setMessage({ type: "success", text: t("auth.loginSuccess") });
      await showSuccessAlert({ title: t("auth.loginSuccess") });
      window.location.href = nextPath;
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Authentication failed";
      setMessage({ type: "error", text: messageText });
      await showErrorAlert({ title: "Error", text: messageText });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white/60 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-sm flex-col justify-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700/60">
          {lang === "th" ? "ช่าง/แอดมิน" : "Backoffice"}
        </div>
        <div className="rounded-[26px] bg-[#dff7b5] px-6 py-7 text-emerald-900 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center">
            <img
              src="/logo_bc.png"
              alt="BC"
              className="h-14 w-auto drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]"
            />
          </div>
          <h1 className="mt-2 text-center text-sm font-semibold text-emerald-900">
            {lang === "th" ? "เข้าสู่ระบบช่าง/แอดมิน" : "Backoffice login"}
          </h1>
          <Card className="mt-4 space-y-3 rounded-2xl border border-emerald-300/70 bg-white/95 p-4 shadow-[0_10px_20px_rgba(16,89,46,0.2)]">
            <Input
              type="email"
              value={email}
              placeholder={t("auth.email")}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-xl"
            />
            <Input
              type="password"
              value={password}
              placeholder={t("auth.password")}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-xl"
            />
          </Card>
          {message ? (
            <div
              className={
                message.type === "error"
                  ? "mt-3 text-xs text-rose-600"
                  : "mt-3 text-xs text-emerald-700"
              }
            >
              {message.text}
            </div>
          ) : null}
          <Button
            className="mt-4 w-full rounded-2xl bg-emerald-700 text-white shadow-[0_6px_12px_rgba(16,89,46,0.35)] hover:bg-emerald-800"
            onClick={handleAuth}
            disabled={submitting}
          >
            {submitting ? "..." : t("actions.login")}
          </Button>
          <div className="mt-3 text-xs text-emerald-800/70">
            {lang === "th" ? "กลับไปหน้าเข้าสู่ระบบผู้ใช้ " : "Back to user login "}
            <Link href="/login" className="font-semibold text-emerald-800">
              {t("actions.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BackofficeLoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[--text-soft]">Loading...</div>}>
      <BackofficeLoginInner />
    </Suspense>
  );
}
