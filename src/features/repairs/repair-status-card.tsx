"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusStepper } from "@/components/ui/status-stepper";
import { useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import type { RepairRequest } from "@/types/repair";

type RepairStatusCardProps = {
  repair: RepairRequest;
};

export default function RepairStatusCard({ repair }: RepairStatusCardProps) {
  const { t, pick } = useI18n();
  const steps = [
    { key: "received", label: t("status.received") },
    { key: "diagnosing", label: t("status.diagnosing") },
    { key: "repairing", label: t("status.repairing") },
    { key: "completed", label: t("status.completed") },
  ];
  const rank = {
    received: 1,
    diagnosing: 2,
    repairing: 3,
    completed: 4,
    rejected: 4,
  } as const;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[--text-strong]">
            {pick(repair.title)}
          </h3>
          <p className="text-xs text-[--text-soft]">
            {repair.vehicleModel} · {repair.trackingCode}
          </p>
        </div>
        <Badge>{t(`status.${repair.status}` as TranslationKey)}</Badge>
      </div>
      <StatusStepper current={repair.status} steps={steps} rank={rank} />
      <div className="rounded-2xl border border-emerald-200 bg-white/70 p-3 text-xs text-[--text-mid]">
        <div className="font-semibold">{t("status.timeline")}</div>
        <div className="mt-2 space-y-1">
          {repair.timeline.map((entry) => (
            <div key={`${entry.status}-${entry.updatedAt}`}>
              <span className="font-semibold">
                {t(`status.${entry.status}` as TranslationKey)}
              </span>{" "}
              · {entry.updatedAt} {entry.note ? `· ${entry.note}` : ""}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
