"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/40 bg-white/70 p-1 text-xs font-semibold text-[--text-mid]">
      {(["th", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLang(value)}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            lang === value
              ? "bg-emerald-600 text-white shadow-[--shadow-pill]"
              : "hover:bg-emerald-50",
          )}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
