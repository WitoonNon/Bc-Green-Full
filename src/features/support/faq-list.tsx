"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, type Firestore } from "firebase/firestore";
import { SearchInput } from "@/components/ui/search-input";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { faqs as seedFaqs } from "@/data/support";
import type { FaqItem } from "@/types/support";

export default function FaqList() {
  const { t, pick } = useI18n();
  const [queryText, setQueryText] = useState("");
  const [items, setItems] = useState<FaqItem[]>(seedFaqs);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return;

    const firestore = db as Firestore;
    const faqQuery = query(
      collection(firestore, "faqs"),
      where("published", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(faqQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FaqItem, "id">),
      }));
      setItems(data.length > 0 ? data : seedFaqs);
    });

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = queryText.toLowerCase();
    return items.filter((item) => {
      return (
        pick(item.question).toLowerCase().includes(q) ||
        pick(item.answer).toLowerCase().includes(q)
      );
    });
  }, [items, queryText, pick]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder={t("support.searchHint")}
        value={queryText}
        onChange={(event) => setQueryText(event.target.value)}
      />
      <div className="space-y-3">
        {filtered.map((item) => (
          <details
            key={item.id}
            className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-[--text-mid] open:shadow-[--shadow-pill] transition-all"
          >
            <summary className="cursor-pointer list-none font-semibold text-[--text-strong] flex justify-between items-center">
              <span>{pick(item.question)}</span>
              <span className="text-emerald-500 transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="mt-3 space-y-3">
              {item.image && (
                <div className="overflow-hidden rounded-xl border border-emerald-100">
                  <img src={item.image} alt="FAQ" className="w-full object-cover max-h-60" />
                </div>
              )}
              <p className="text-sm text-[--text-soft] leading-relaxed whitespace-pre-wrap">
                {pick(item.answer)}
              </p>
            </div>
          </details>
        ))}
        {!filtered.length && (
          <div className="py-10 text-center text-sm text-[--text-soft]">
            {t("actions.search")}...
          </div>
        )}
      </div>
    </div>
  );
}
