"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { RepairRequest } from "@/types/repair";

type RepairHistoryListProps = {
  items: RepairRequest[];
};

export default function RepairHistoryList({ items }: RepairHistoryListProps) {
  const { t, pick } = useI18n();

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((repair) => (
        <Card key={repair.id} className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[--text-strong]">
                {pick(repair.title)}
              </h3>
              <p className="text-xs text-[--text-soft]">
                {repair.vehicleModel} · {repair.trackingCode}
              </p>
            </div>
            <Badge tone={repair.status === "completed" ? "green" : "gray"}>
              {t(`status.${repair.status}` as TranslationKey)}
            </Badge>
          </div>
          <p className="text-xs text-[--text-mid]">
            {repair.createdAt} · {repair.updatedAt ?? repair.createdAt}
          </p>
        </Card>
      ))}
    </div>
  );
}
