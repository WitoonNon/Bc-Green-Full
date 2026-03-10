"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, type Firestore } from "firebase/firestore";
import { ArrowRightIcon, BookIcon } from "@/components/icons";
import { SearchInput } from "@/components/ui/search-input";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { manuals as seedManuals } from "@/data/support";
import type { ManualItem } from "@/types/support";

export default function ManualList() {
  const { t, pick } = useI18n();
  const [queryText, setQueryText] = useState("");
  const [items, setItems] = useState<ManualItem[]>(seedManuals);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return;

    const firestore = db as Firestore;
    const manualQuery = query(
      collection(firestore, "manuals"),
      where("published", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(manualQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ManualItem, "id">),
      }));
      setItems(data.length > 0 ? data : seedManuals);
    });

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = queryText.toLowerCase();
    return items.filter((item) => {
      return (
        pick(item.title).toLowerCase().includes(q) ||
        pick(item.summary).toLowerCase().includes(q)
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
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <Link key={item.id} href={item.link}>
            <div className="flex h-full items-center justify-between rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt="" className="h-12 w-16 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <BookIcon size={18} />
                  </span>
                )}
                <div>
                  <div className="text-sm font-semibold text-[--text-strong] group-hover:text-emerald-700 transition-colors">
                    {pick(item.title)}
                  </div>
                  <div className="text-xs text-[--text-soft] line-clamp-1">
                    {pick(item.summary)}
                  </div>
                </div>
              </div>
              <ArrowRightIcon className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
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
