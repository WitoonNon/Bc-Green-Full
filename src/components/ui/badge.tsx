"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "amber" | "gray" | "red";
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  gray: "bg-zinc-100 text-zinc-700",
  red: "bg-rose-100 text-rose-700",
};

export function Badge({ className, tone = "green", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
