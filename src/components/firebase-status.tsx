"use client";

import { app, isFirebaseConfigured } from "@/lib/firebase/client";
import { useI18n } from "@/components/i18n-provider";

export default function FirebaseStatus() {
  const { lang } = useI18n();
  if (!isFirebaseConfigured || !app) {
    return (
      <p className="text-sm text-amber-700">
        {lang === "th"
          ? "Firebase ยังไม่ถูกตั้งค่า เพิ่มค่า env ใน .env.local"
          : "Firebase is not configured. Add env vars in .env.local."}
      </p>
    );
  }

  return (
    <p className="text-sm text-emerald-700">
      {lang === "th" ? "เชื่อมต่อ Firebase แล้ว:" : "Firebase connected:"}{" "}
      <span className="font-semibold">{app.name}</span>
    </p>
  );
}
