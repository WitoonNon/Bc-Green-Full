"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n-provider";
import { mockNotices } from "@/data/notices";
import {
  subscribeNotificationsForRole,
  markNotificationRead,
} from "@/services/notifications";
import type { AppNotification } from "@/types/notification";

export default function NotificationList() {
  const { lang, t } = useI18n();
  const [items, setItems] = useState<AppNotification[]>(mockNotices);

  useEffect(() => {
    const unsubscribe = subscribeNotificationsForRole(
      "technician",
      (data) => setItems(data),
      () => {
        setItems(mockNotices);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleMarkRead = async (noticeId: string) => {
    await markNotificationRead(noticeId);
    setItems((prev) =>
      prev.map((item) => (item.id === noticeId ? { ...item, read: true } : item)),
    );
  };

  const labelSeen = lang === "th" ? "อ่านแล้ว" : "Seen";
  const labelNew = lang === "th" ? "ใหม่" : "New";
  const markSeenLabel = lang === "th" ? "ทำเครื่องหมายว่าอ่านแล้ว" : "Mark seen";

  if (!items.length) {
    return (
      <p className="text-sm text-[--text-soft]">
        {lang === "th" ? "ไม่มีแจ้งเตือนในช่วงนี้" : "No new notices."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <BellIcon size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold text-[--text-strong]">
                  {item.title}
                </div>
                <div className="text-xs text-[--text-soft]">{item.message}</div>
                {item.link ? (
                  <Link
                    href={item.link}
                    className="mt-1 inline-flex text-xs font-semibold text-emerald-700"
                  >
                    {t("actions.viewTicket")}
                  </Link>
                ) : null}
              </div>
            </div>
            <Badge tone={item.read ? "gray" : "amber"}>
              {item.read ? labelSeen : labelNew}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-[--text-soft]">
            <span>{item.createdAt}</span>
            {!item.read ? (
              <button
                type="button"
                className="font-semibold text-emerald-700"
                onClick={() => handleMarkRead(item.id)}
              >
                {markSeenLabel}
              </button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
