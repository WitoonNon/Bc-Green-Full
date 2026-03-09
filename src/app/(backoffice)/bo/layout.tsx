"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import LanguageToggle from "@/components/sections/language-toggle";
import Logo from "@/components/sections/logo";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  match?: string;
};

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const { signOut, user } = useAuth();
  const pathname = usePathname();
  const [role, setRole] = useState<"user" | "technician" | "admin" | null>(null);
  const [roleError, setRoleError] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const navItems: NavItem[] = [
    { href: "/bo/dashboard", label: t("backoffice.dashboard") },
    { href: "/bo/tickets", label: t("backoffice.tickets") },
    { href: "/bo/announcements", label: t("backoffice.announcements") },
    { href: "/bo/vehicles", label: t("backoffice.vehicles") },
    { href: "/bo/help/faq", label: t("backoffice.help"), match: "/bo/help" },
    { href: "/bo/promotions", label: t("backoffice.promotions") },
    { href: "/bo/users", label: t("backoffice.users") },
  ];
  const filteredNav =
    role === "technician"
      ? navItems.filter((item) =>
        ["/bo/dashboard", "/bo/tickets"].includes(item.href),
      )
      : navItems;

  useEffect(() => {
    setRoleError("");
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setRole("admin");
      setRoleLoading(false);
      return;
    }
    const ref = doc(db!, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data() as { role?: "user" | "technician" | "admin" } | undefined;
        setRole(data?.role ?? "user");
        setRoleLoading(false);
      },
      (err) => {
        setRoleError(err.message);
        setRoleLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user]);

  if (roleLoading) {
    return (
      <AuthGuard>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[--text-soft]">
          {lang === "th" ? "กำลังตรวจสอบสิทธิ์..." : "Checking access..."}
        </div>
      </AuthGuard>
    );
  }

  if (roleError) {
    return (
      <AuthGuard>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-rose-600">
          {roleError}
        </div>
      </AuthGuard>
    );
  }

  if (role !== "admin" && role !== "technician") {
    return (
      <AuthGuard>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[--text-soft]">
          {lang === "th"
            ? "บัญชีนี้ยังไม่มีสิทธิ์เข้าหน้าช่าง/แอดมิน"
            : "This account does not have backoffice access."}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_rgba(222,247,200,0.9))] px-3 py-4 pb-28 sm:px-4 sm:py-6 sm:pb-6">
        <div className="mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden sm:space-y-6">
          <header className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/80 px-4 py-4 shadow-[--shadow-card] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Logo size="md" className="text-emerald-700" />
              <div className="text-sm font-semibold text-[--text-strong]">
                {t("backoffice.title")}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageToggle />
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                {t("actions.signOut")}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700">
                BO
              </div>
            </div>
          </header>
          <div className="grid gap-4 md:gap-6 md:grid-cols-[220px_1fr]">
            <aside className="hidden md:block md:space-y-2 md:pb-0">
              {filteredNav.map((item) => {
                const isActive = pathname.startsWith(item.match ?? item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-w-[140px] items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold transition md:min-w-0",
                      isActive
                        ? "bg-emerald-600 text-white shadow-[--shadow-pill]"
                        : "bg-white/70 text-[--text-mid] hover:border-emerald-200 hover:bg-emerald-50",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </aside>
            <main className="space-y-6">{children}</main>
          </div>
          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-4 bottom-4 z-40 rounded-full border border-emerald-100 bg-white shadow-[--shadow-card] md:hidden">
            <div className="flex items-center justify-around px-2 py-2">
              {filteredNav.map((item) => {
                const isActive = pathname.startsWith(item.match ?? item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-full px-2 py-2 text-xs font-semibold transition",
                      isActive
                        ? "bg-emerald-600 text-white shadow-[--shadow-pill]"
                        : "text-[--text-mid]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </AuthGuard>
  );
}
