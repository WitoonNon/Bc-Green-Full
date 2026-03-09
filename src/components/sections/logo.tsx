"use client";

import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
};

export default function Logo({ size = "md", className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/logo_bc.png"
        alt="BC"
        className={cn("w-auto drop-shadow", sizeStyles[size])}
      />
    </div>
  );
}
