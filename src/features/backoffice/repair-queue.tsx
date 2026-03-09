"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/components/i18n-provider";
import { mockRepairs } from "@/data/repairs";
import {
  listOpenRepairs,
  mapRepairFromData,
  updateRepairStatus,
} from "@/services/repairs";
import type { TranslationKey } from "@/lib/i18n";
import type { RepairRequest, RepairStatus } from "@/types/repair";

const statusOptions: RepairStatus[] = [
  "received",
  "diagnosing",
  "repairing",
  "completed",
];

export default function RepairQueue() {
  const { t, pick } = useI18n();
  const [items, setItems] = useState<RepairRequest[]>(mockRepairs);
  const [selected, setSelected] = useState<Record<string, RepairStatus>>({});

  useEffect(() => {
    const load = async () => {
      const result = await listOpenRepairs();
      if (result.ok) {
        const mapped = (result.data as Record<string, unknown>[]).map(
          (item) => mapRepairFromData(item),
        );
        setItems(mapped);
      }
    };
    void load();
  }, []);

  const handleUpdate = async (repairId: string) => {
    const status = selected[repairId];
    if (!status) {
      return;
    }
    await updateRepairStatus(repairId, status);
  };

  return (
    <div className="space-y-3">
      {items.map((repair) => (
        <Card key={repair.id} className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-[--text-strong]">
              {pick(repair.title)}
            </div>
            <div className="text-xs text-[--text-soft]">
              {repair.trackingCode} · {repair.vehicleModel}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selected[repair.id] ?? repair.status}
              onChange={(event) =>
                setSelected((prev) => ({
                  ...prev,
                  [repair.id]: event.target.value as RepairStatus,
                }))
              }
              className="max-w-[200px]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}` as TranslationKey)}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdate(repair.id)}
            >
              {t("actions.update")}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
