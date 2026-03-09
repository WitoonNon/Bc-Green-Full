"use client";

import Logo from "@/components/sections/logo";
import LanguageToggle from "@/components/sections/language-toggle";
import TopNav from "@/components/sections/top-nav";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";

export default function TopBar() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();

  return (
    <header className="rounded-3xl border border-white/70 bg-white/80 px-6 py-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="md" className="text-emerald-700" />
          {/* <div className="text-sm font-semibold text-[--text-strong]">
            {t("brand.portal")}
          </div> */}
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:px-3 sm:text-xs"
            >
              {t("actions.signOut")}
            </button>
          ) : null}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700">
            BC
          </div>
        </div>
      </div>
      <TopNav className="mt-4 hidden md:flex" />
    </header>
  );
}
