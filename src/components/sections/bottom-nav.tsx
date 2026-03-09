"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { navItems, isNavActive } from "@/components/sections/nav-items";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  className?: string;
};

export default function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 mx-4 rounded-3xl border border-white/60 bg-white/90 px-3 py-3 shadow-lg backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {navItems.map((item) => {
          const { href, icon: Icon, labelKey } = item;
          const isActive = isNavActive(pathname, item);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold leading-none transition",
                isActive
                  ? "bg-emerald-600 text-white shadow-[--shadow-pill]"
                  : "text-[--text-mid] hover:bg-emerald-50",
              )}
            >
              <Icon size={18} />
              <span className="w-full truncate text-center">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
