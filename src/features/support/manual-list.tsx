"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, BookIcon } from "@/components/icons";
import { SearchInput } from "@/components/ui/search-input";
import { useI18n } from "@/components/i18n-provider";
import { manuals } from "@/data/support";

export default function ManualList() {
  const { t, pick } = useI18n();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return manuals.filter((item) => {
      return (
        pick(item.title).toLowerCase().includes(q) ||
        pick(item.summary).toLowerCase().includes(q)
      );
    });
  }, [query, pick]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder={t("support.searchHint")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.id} href={item.link}>
            <div className="flex h-full items-center justify-between rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <BookIcon size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-[--text-strong]">
                    {pick(item.title)}
                  </div>
                  <div className="text-xs text-[--text-soft]">
                    {pick(item.summary)}
                  </div>
                </div>
              </div>
              <ArrowRightIcon className="text-emerald-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
