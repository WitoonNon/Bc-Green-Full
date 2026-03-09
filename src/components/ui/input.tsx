"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-emerald-700/20 bg-white px-4 text-sm text-[--text-strong] outline-none transition focus:border-emerald-700/60 focus:ring-2 focus:ring-emerald-200",
        className,
      )}
      {...props}
    />
  );
}
