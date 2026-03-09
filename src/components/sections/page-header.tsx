"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  logoSrc?: string;
  logoAlt?: string;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
  logoSrc,
  logoAlt = "BC",
}: PageHeaderProps) {
  return (
    <header className="animate-rise relative w-full max-w-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-500 px-5 py-4 text-white shadow-lg sm:px-6 sm:py-5">
      <div className="absolute -right-10 -top-16 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -left-12 top-6 h-24 w-24 rounded-full bg-lime-200/20" />
      <div className="relative flex items-start gap-4">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-2 group shrink-0"
            title="ย้อนกลับ"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition-all group-hover:bg-emerald-50 group-hover:shadow-md">
              <ArrowRightIcon className="rotate-180" size={20} />
            </div>
            <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
              ย้อนกลับ
            </span>
          </Link>
        ) : null}
        <div className="space-y-1">
          <h1 className={cn("text-2xl font-semibold tracking-tight")}>{title}</h1>
          {subtitle ? <p className="text-sm text-white/80">{subtitle}</p> : null}
        </div>
        {logoSrc ? (
          <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <img src={logoSrc} alt={logoAlt} className="h-8 w-auto" />
          </div>
        ) : null}
      </div>
    </header>
  );
}
