"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type AuthMessage = {
  type: "error" | "success";
  text: string;
};

function LoginPageInner() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") ?? "/home", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
      setMessage({
        type: "error",
        text: t("auth.fillAllFields"),
      });
      await showErrorAlert({ title: "Error", text: t("auth.fillAllFields") });
      return;
    }

    try {
      setSubmitting(true);
      if (!isFirebaseConfigured) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        setSessionCookie("1", remember ? 60 * 60 * 24 * 30 : undefined);
      } else {
        const credential = await signInWithEmailAndPassword(auth!, email, password);
        if (credential.user && !credential.user.isAnonymous) {
          setSessionCookie("1", remember ? 60 * 60 * 24 * 30 : undefined);
        }
      }
      setMessage({
        type: "success",
        text: t("auth.loginSuccess"),
      });
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
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          {/* {t("actions.login")} */}
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
            {t("auth.title")}
          </h1>
          <Card className="mt-4 space-y-3 rounded-2xl border border-emerald-300/70 bg-white/95 p-4 shadow-[0_10px_20px_rgba(16,89,46,0.2)]">
            <Input
              type="email"
              value={email}
              placeholder={t("auth.email")}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-xl"
              autoFocus
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder={t("auth.password")}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700/50 hover:text-emerald-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-800/70">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-emerald-400 accent-emerald-600"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                {t("auth.remember")}
              </label>
              <Link href="/forgot-password" className="font-semibold text-emerald-700">
                {t("auth.forgot")}
              </Link>
            </div>
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
          <div className="my-4 flex items-center gap-3 text-[11px] font-semibold text-emerald-800/70">
            <span className="h-px flex-1 bg-emerald-700/20" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-emerald-700/20" />
          </div>
          <Link href="/signup" className="block">
            <Button
              variant="outline"
              className="w-full rounded-2xl border-emerald-400/60 bg-white text-emerald-800 shadow-[0_6px_12px_rgba(16,89,46,0.15)] hover:bg-emerald-50"
            >
              {t("actions.createAccount")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
