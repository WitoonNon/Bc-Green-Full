"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import PageHeader from "@/components/sections/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  subscribeTicketById,
  updateTicketStatus,
} from "@/services/tickets";
import type { TranslationKey } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { getVehicleById } from "@/data/vehicles";
import type { Ticket, TicketStatus } from "@/types/ticket";
import type { VehicleItem } from "@/types/vehicle";

const statusOptions: TicketStatus[] = [
  "NEW",
  "CHECKING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export default function BackofficeTicketDetailPage() {
  const { t, lang } = useI18n();
  const params = useParams();
  const ticketId = String(params?.id ?? "");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TicketStatus>("NEW");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [vehicleLoaded, setVehicleLoaded] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      return;
    }
    const unsubscribe = subscribeTicketById(
      ticketId,
      (data) => {
        setTicket(data);
        setLoaded(true);
        if (data) {
          setStatus(data.status);
        }
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [ticketId]);

  useEffect(() => {
    if (!ticket?.vehicleId) {
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setVehicle(getVehicleById(ticket.vehicleId) ?? null);
      setVehicleLoaded(true);
      return;
    }
    const firestore = db as Firestore;
    const vehicleRef = doc(firestore, "vehicles", ticket.vehicleId);
    const unsubscribe = onSnapshot(
      vehicleRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setVehicle(null);
          setVehicleLoaded(true);
          return;
        }
        setVehicle({
          id: snapshot.id,
          ...(snapshot.data() as Omit<VehicleItem, "id">),
        });
        setVehicleLoaded(true);
      },
      () => {
        setVehicle(null);
        setVehicleLoaded(true);
      },
    );
    return () => unsubscribe();
  }, [ticket?.vehicleId]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (loaded && !ticket) {
    return (
      <p className="text-sm text-[--text-soft]">
        {lang === "th" ? "ไม่พบข้อมูลงานนี้" : "Ticket not found."}
      </p>
    );
  }

  if (!ticket) {
    return (
      <div className="text-sm text-[--text-soft]">
        {lang === "th" ? "กำลังโหลดข้อมูล..." : "Loading ticket..."}
      </div>
    );
  }

  const categoryLabel =
    ticket.category === "repair" ? t("nav.repair") : ticket.category;
  const repairDate = ticket.repairDate ?? ticket.createdAt;

  const isLocked = ticket.status === "DONE" || ticket.status === "CANCELLED";

  const handleUpdate = async () => {
    if (isLocked) return;
    await updateTicketStatus(ticket.id, status, note);
    setNote("");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={ticket.title}
        subtitle={`${categoryLabel} - ${ticket.readableNo}`}
        backHref="/bo/tickets"
      />
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[--text-soft]">{t("fields.status")}</div>
            <div className="text-sm font-semibold text-[--text-strong]">
              {t(`status.${ticket.status}` as TranslationKey)}
            </div>
          </div>
          <Badge>{t(`status.${ticket.status}` as TranslationKey)}</Badge>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[--text-mid]">
            {t("fields.description")}
          </div>
          <p className="text-sm text-[--text-soft]">{ticket.description}</p>
        </div>
        {vehicle ? (
          <Card className="flex flex-wrap items-center gap-4 border-emerald-100 bg-white">
            {vehicle.image ? (
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="h-20 w-28 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-emerald-50 text-xs text-emerald-700">
                {lang === "th" ? "ไม่มีรูป" : "No image"}
              </div>
            )}
            <div className="space-y-1 text-xs text-[--text-soft]">
              <div className="text-sm font-semibold text-[--text-strong]">
                {lang === "th" ? "ชื่อรถและรุ่น" : "Vehicle"}
              </div>
              <div className="text-[--text-mid]">{vehicle.name}</div>
              <div>
                {lang === "th" ? "รหัสสินค้า" : "Code"}: {vehicle.code || "-"}
              </div>
              <div>
                {lang === "th" ? "ระยะเวลาประกันสินค้า" : "Warranty"}:{" "}
                {vehicle.warranty || "-"}
              </div>
            </div>
          </Card>
        ) : vehicleLoaded ? (
          <div className="text-xs text-[--text-soft]">
            {lang === "th" ? "ยังไม่มีข้อมูลรุ่นรถ" : "Vehicle info not found."}
          </div>
        ) : null}
        <Card className="space-y-2 border-emerald-100 bg-white">
          <div className="text-sm font-semibold text-emerald-700">
            {lang === "th" ? "ข้อมูลงานซ่อม" : "Repair details"}
          </div>
          <div className="text-xs text-[--text-mid]">
            {lang === "th" ? "วันที่แจ้งซ่อม" : "Repair date"}:{" "}
            {formatDateTime(repairDate)}
          </div>
          <div className="text-xs text-[--text-mid]">
            {lang === "th" ? "สถานะ" : "Status"}:{" "}
            {t(`status.${ticket.status}` as TranslationKey)}
          </div>
        </Card>
        {ticket.attachments.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[--text-mid]">
              {t("fields.attachments")}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ticket.attachments.map((file) => {
                const isImage = file.type.startsWith("image/");
                if (isImage) {
                  return (
                    <a
                      key={file.path}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-40 w-full object-cover"
                      />
                      <div className="px-3 py-2 text-xs font-semibold text-emerald-700">
                        {file.name}
                      </div>
                    </a>
                  );
                }
                return (
                  <a
                    key={file.path}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-emerald-100 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-700"
                  >
                    {file.name}
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 p-3 text-xs text-[--text-mid]">
          <div className="font-semibold">{t("status.timeline")}</div>
          <div className="mt-2 space-y-1">
            {ticket.timeline.map((entry) => (
              <div key={`${entry.status}-${entry.at}`}>
                <span className="font-semibold">
                  {t(`status.${entry.status}` as TranslationKey)}
                </span>{" "}
                - {formatDateTime(entry.at)}
                {entry.note ? ` - ${entry.note}` : ""}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as TicketStatus)}
            disabled={isLocked}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {t(`status.${item}` as TranslationKey)}
              </option>
            ))}
          </Select>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("backoffice.updateStatus")}
            rows={3}
            disabled={isLocked}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <Button onClick={handleUpdate} disabled={isLocked}>
            {t("actions.update")}
          </Button>
        </div>
        {isLocked ? (
          <div className="text-center text-xs text-[--text-soft]">
            {lang === "th"
              ? "สถานะปิดงานแล้ว ไม่สามารถอัปเดตต่อได้"
              : "Ticket is closed; further updates are disabled."}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
