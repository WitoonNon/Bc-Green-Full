"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-emerald-700/20 bg-white px-4 py-3 text-sm text-[--text-strong] outline-none transition focus:border-emerald-700/60 focus:ring-2 focus:ring-emerald-200",
        className,
      )}
      {...props}
    />
  );
}
