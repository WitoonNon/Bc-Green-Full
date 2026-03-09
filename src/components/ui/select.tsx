"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-emerald-700/20 bg-white px-4 text-sm text-[--text-strong] outline-none transition focus:border-emerald-700/60 focus:ring-2 focus:ring-emerald-200",
        className,
      )}
      {...props}
    />
  );
}
