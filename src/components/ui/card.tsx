"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "muted";
};

export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/60 !bg-white p-5 shadow-lg",
        tone === "muted" && "!bg-white",
        className,
      )}
      {...props}
    />
  );
}
