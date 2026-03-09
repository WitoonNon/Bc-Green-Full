"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import type { PromotionItem } from "@/types/promotion";

type PromoCardProps = {
  item: PromotionItem;
};

export default function PromoCard({ item }: PromoCardProps) {
  const { pick } = useI18n();

  return (
    <Card className="animate-fade relative h-full overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/40" />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[--text-strong]">
              {pick(item.title)}
            </h3>
            <p className="text-xs text-[--text-soft]">{pick(item.subtitle)}</p>
          </div>
          {item.badge ? <Badge>{pick(item.badge)}</Badge> : null}
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80">
          <Image
            src={item.image}
            alt={pick(item.title)}
            width={420}
            height={220}
            className="h-[180px] w-full object-cover md:h-[220px]"
          />
        </div>
      </div>
    </Card>
  );
}
