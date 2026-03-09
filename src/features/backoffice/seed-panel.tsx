"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { seedCollections } from "@/services/seed";

type SeedState = "idle" | "loading" | "done" | "skipped" | "error";

export default function SeedPanel() {
  const { t } = useI18n();
  const [state, setState] = useState<SeedState>("idle");
  const [message, setMessage] = useState<string>("");

  const handleSeed = async () => {
    setState("loading");
    const result = await seedCollections();
    if (result.ok && result.seeded) {
      setState("done");
      setMessage(t("backoffice.seedSuccess"));
      return;
    }
    if (result.ok && result.seeded === false) {
      setState("skipped");
      setMessage(t("backoffice.seedExists"));
      return;
    }
    setState("error");
    setMessage(result.error ?? t("backoffice.seedError"));
  };

  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-[--text-strong]">
          {t("backoffice.seedTitle")}
        </div>
        <div className="text-xs text-[--text-soft]">
          {t("backoffice.seedSubtitle")}
        </div>
      </div>
      {message ? (
        <div
          className={
            state === "error"
              ? "text-xs text-rose-600"
              : "text-xs text-emerald-700"
          }
        >
          {message}
        </div>
      ) : null}
      <Button onClick={handleSeed} disabled={state === "loading"}>
        {state === "loading" ? t("backoffice.seedLoading") : t("backoffice.seedButton")}
      </Button>
    </Card>
  );
}
