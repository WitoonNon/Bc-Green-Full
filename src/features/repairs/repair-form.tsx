"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { createRepairRequest } from "@/services/repairs";

type SubmitState = "idle" | "loading" | "success" | "error";

const categories = [
  { value: "battery", th: "แบตเตอรี่", en: "Battery" },
  { value: "brake", th: "ระบบเบรก", en: "Brake system" },
  { value: "motor", th: "มอเตอร์", en: "Motor" },
  { value: "body", th: "โครงสร้าง", en: "Body & frame" },
  { value: "other", th: "อื่นๆ", en: "Other" },
];

export default function RepairForm() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState({
    preferredDate: "",
    category: "battery",
    detail: "",
    title: "",
    vehicleModel: "",
    serialNumber: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const errorText =
    lang === "th"
      ? "ส่งคำร้องไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Firebase"
      : "Submit failed. Please check Firebase configuration.";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    const result = await createRepairRequest(
      {
        title: form.title,
        category: form.category,
        detail: form.detail,
        preferredDate: form.preferredDate,
        vehicleModel: form.vehicleModel,
        serialNumber: form.serialNumber || undefined,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail || undefined,
      },
      files,
    );

    if (result.ok) {
      setState("success");
      setMessage(`${t("repair.success")} (${result.trackingCode})`);
      setForm({
        preferredDate: "",
        category: "battery",
        detail: "",
        title: "",
        vehicleModel: "",
        serialNumber: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
      });
      setFiles([]);
    } else {
      setState("error");
      setMessage(result.error ?? errorText);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[--text-strong]">
          {t("repair.formTitle")}
        </h3>
        <p className="text-sm text-[--text-soft]">{t("repair.formHint")}</p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.date")}
          </label>
          <Input
            type="date"
            value={form.preferredDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, preferredDate: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.category")}
          </label>
          <Select
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value }))
            }
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {lang === "th" ? item.th : item.en}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.issueTitle")}
          </label>
          <Input
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder={lang === "th" ? "อธิบายสั้นๆ" : "Short summary"}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.detail")}
          </label>
          <Textarea
            value={form.detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, detail: event.target.value }))
            }
            placeholder={
              lang === "th"
                ? "เล่าอาการที่พบ ช่วงเวลาที่เกิด และสิ่งที่ได้ลองแก้ไข"
                : "Describe the issue, when it happens, and what you've tried."
            }
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[--text-mid]">
              {t("fields.model")}
            </label>
            <Input
              value={form.vehicleModel}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, vehicleModel: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[--text-mid]">
              {t("fields.serial")}
            </label>
            <Input
              value={form.serialNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, serialNumber: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[--text-mid]">
              {t("fields.contactName")}
            </label>
            <Input
              value={form.contactName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contactName: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[--text-mid]">
              {t("fields.contactPhone")}
            </label>
            <Input
              value={form.contactPhone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contactPhone: event.target.value }))
              }
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.contactEmail")}
          </label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("repair.attachments")}
          </label>
          <Input
            type="file"
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
          />
          {files.length ? (
            <div className="text-xs text-[--text-soft]">
              {files.map((file) => file.name).join(", ")}
            </div>
          ) : null}
        </div>
        {message ? (
          <p
            className={
              state === "success"
                ? "text-sm text-emerald-700"
                : "text-sm text-rose-600"
            }
          >
            {message}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={state === "loading"}>
            {state === "loading" ? "..." : t("actions.submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                detail: "",
                title: "",
                preferredDate: "",
              }))
            }
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
