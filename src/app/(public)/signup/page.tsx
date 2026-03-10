"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type AuthMessage = {
  type: "error" | "success";
  text: string;
};

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    setMessage(null);
    if (!email || !password || !displayName) {
      setMessage({
        type: "error",
        text: t("auth.fillAllFields"),
      });
      await showErrorAlert({ title: "Error", text: t("auth.fillAllFields") });
      return;
    }

    if (password !== confirm) {
      setMessage({
        type: "error",
        text: t("auth.passwordMismatch"),
      });
      await showErrorAlert({ title: "Error", text: t("auth.passwordMismatch") });
      return;
    }

    try {
      setSubmitting(true);
      if (!isFirebaseConfigured) {
        // call local API stub
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, email, password }),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      } else {
        const result = await createUserWithEmailAndPassword(auth!, email, password);
        if (db) {
          const firestore = db as Firestore;
          await setDoc(doc(firestore, "users", result.user.uid), {
            displayName,
            email,
            phone: "",
            address: { line1: "", district: "", province: "", zip: "" },
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        setSessionCookie("1");
      }

      setMessage({
        type: "success",
        text: t("auth.signupSuccess"),
      });
      await showSuccessAlert({ title: t("auth.signupSuccess") });
      window.location.href = "/home";
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Sign up failed";
      setMessage({ type: "error", text: messageText });
      await showErrorAlert({ title: "Error", text: messageText });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white/60 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-sm flex-col justify-center gap-3">
        {/* <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          {t("actions.createAccount")}
        </div> */}
        <div className="rounded-[26px] bg-[#dff7b5] px-6 py-7 text-emerald-900 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center">
            <img
              src="/logo_bc.png"
              alt="BC"
              className="h-14 w-auto drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]"
            />
          </div>
          <h1 className="mt-2 text-center text-sm font-semibold text-emerald-900">
            {t("actions.createAccount")}
          </h1>
          <div className="mt-4 space-y-3 rounded-2xl border border-emerald-300/70 bg-white/95 p-4 shadow-[0_10px_20px_rgba(16,89,46,0.2)]">
            <Input
              value={displayName}
              placeholder={t("auth.displayName")}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-10 rounded-xl"
            />
            <Input
              type="email"
              value={email}
              placeholder={t("auth.email")}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-xl"
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
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                placeholder={t("auth.confirmPassword")}
                onChange={(event) => setConfirm(event.target.value)}
                className="h-10 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700/50 hover:text-emerald-700"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
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
            onClick={handleSignup}
            disabled={submitting}
          >
            {submitting ? "..." : t("actions.createAccount")}
          </Button>
          <div className="mt-3 text-xs text-emerald-800/70 text-center">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-emerald-800">
              {t("actions.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
