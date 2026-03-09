"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionTitleProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle?: string;
};

export function SectionTitle({
  title,
  subtitle,
  className,
  ...props
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <h2 className="text-lg font-semibold text-[--text-strong]">{title}</h2>
      {subtitle ? <p className="text-sm text-[--text-soft]">{subtitle}</p> : null}
    </div>
  );
}
