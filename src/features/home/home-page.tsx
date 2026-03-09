"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
} from "firebase/firestore";
import PageHeader from "@/components/sections/page-header";
import PromoCard from "@/components/sections/promo-card";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { SupportIcon, WrenchIcon, StatusIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AnnouncementItem } from "@/types/announcement";
import type { PromotionItem } from "@/types/promotion";

export default function HomePage() {
  const { t, pick, lang } = useI18n();
  const repairHint = t("ticket.newSubtitle");
  const statusHint = t("ticket.subtitle");
  const supportHint = t("support.subtitle");
  const [announcementItems, setAnnouncementItems] = useState<AnnouncementItem[]>(
    [],
  );
  const [promotionItems, setPromotionItems] = useState<PromotionItem[]>([]);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    const announcementQuery = query(
      collection(firestore, "announcements"),
      orderBy("date", "desc"),
    );
    const promotionQuery = query(
      collection(firestore, "promotions"),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribeAnnouncements = onSnapshot(announcementQuery, (snapshot) => {
      const data = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AnnouncementItem, "id">),
        }))
        .filter(
          (item) =>
            item.published !== false &&
            item.seed !== true &&
            item.source === "backoffice",
        );
      setAnnouncementItems(data);
    });
    const unsubscribePromotions = onSnapshot(promotionQuery, (snapshot) => {
      const data = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PromotionItem, "id">),
        }))
        .filter((item) => item.published !== false);
      setPromotionItems(data);
    });
    return () => {
      unsubscribeAnnouncements();
      unsubscribePromotions();
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />
      <section className="space-y-4">
        <SectionTitle title={t("home.quickActions")} />
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/tickets/new" className="group">
            <Card className="flex items-center gap-3 p-4 transition group-hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <WrenchIcon />
              </span>
              <div>
                <div className="text-sm font-semibold">{t("nav.repair")}</div>
                <div className="text-xs text-[--text-soft]">{repairHint}</div>
              </div>
            </Card>
          </Link>
          <Link href="/tickets" className="group">
            <Card className="flex items-center gap-3 p-4 transition group-hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <StatusIcon />
              </span>
              <div>
                <div className="text-sm font-semibold">{t("nav.status")}</div>
                <div className="text-xs text-[--text-soft]">{statusHint}</div>
              </div>
            </Card>
          </Link>
          <Link href="/help" className="group">
            <Card className="flex items-center gap-3 p-4 transition group-hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <SupportIcon />
              </span>
              <div>
                <div className="text-sm font-semibold">{t("nav.support")}</div>
                <div className="text-xs text-[--text-soft]">{supportHint}</div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title={t("home.promotions")} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {promotionItems.length ? (
            promotionItems.map((item) => <PromoCard key={item.id} item={item} />)
          ) : (
            <div className="py-6 text-center text-sm text-[--text-soft] md:col-span-2 xl:col-span-3">
              {lang === "th" ? "ไม่มีข้อมูล" : "No data available."}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title={t("home.announcements")} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {announcementItems.length ? (
            announcementItems.map((item) => (
              <Card key={item.id} className="space-y-1 p-4">
                <div className="text-sm font-semibold text-[--text-strong]">
                  {pick(item.title)}
                </div>
                <div className="text-xs text-[--text-soft]">
                  {pick(item.detail)}
                </div>
                <div className="text-xs text-[--text-soft]">{item.date}</div>
              </Card>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-[--text-soft] md:col-span-2 xl:col-span-3">
              {lang === "th" ? "ไม่มีข้อมูล" : "No data available."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
