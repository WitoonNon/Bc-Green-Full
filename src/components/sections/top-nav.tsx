"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { navItems, isNavActive } from "@/components/sections/nav-items";
import { cn } from "@/lib/utils";

type TopNavProps = {
  className?: string;
};

export default function TopNav({ className }: TopNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {navItems.map((item) => {
        const { href, icon: Icon, labelKey } = item;
        const isActive = isNavActive(pathname, item);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-full border border-transparent px-3 py-2 font-medium transition",
              isActive
                ? "bg-emerald-600 text-white shadow-[--shadow-pill]"
                : "text-[--text-mid] hover:border-emerald-200 hover:bg-emerald-50",
            )}
          >
            <Icon size={16} />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
