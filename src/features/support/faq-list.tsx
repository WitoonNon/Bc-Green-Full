"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { useI18n } from "@/components/i18n-provider";
import { faqs } from "@/data/support";

export default function FaqList() {
  const { t, pick } = useI18n();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return faqs.filter((item) => {
      return (
        pick(item.question).toLowerCase().includes(q) ||
        pick(item.answer).toLowerCase().includes(q)
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
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-[--text-mid] open:shadow-[--shadow-pill]"
          >
            <summary className="cursor-pointer list-none font-semibold text-[--text-strong]">
              {pick(item.question)}
            </summary>
            <p className="mt-2 text-sm text-[--text-soft]">
              {pick(item.answer)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
