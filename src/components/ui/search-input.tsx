"use client";

import type { InputHTMLAttributes } from "react";
import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-2xl border border-emerald-700/20 bg-white px-3 text-[--text-strong] focus-within:border-emerald-700/60 focus-within:ring-2 focus-within:ring-emerald-200",
        className,
      )}
    >
      <SearchIcon size={18} className="text-emerald-600" />
      <input
        className="h-full w-full bg-transparent text-sm outline-none"
        {...props}
      />
    </div>
  );
}
