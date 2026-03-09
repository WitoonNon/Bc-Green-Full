"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/format";
import { uploadLocalFile } from "@/lib/uploads/client";
import type { VehicleItem } from "@/types/vehicle";

type FormState = {
  name: string;
  code: string;
  warranty: string;
  image: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  warranty: "",
  image: "",
};

const PAGE_SIZE = 8;

export default function VehicleManager() {
  const { lang } = useI18n();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(1);
  const [serverReady, setServerReady] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const seededRef = useRef(false);
  const serverReadyRef = useRef(false);

  const imagePreview = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return imageUrl || form.image;
  }, [imageFile, imageUrl, form.image]);

  useEffect(() => {
    if (!imageFile) return;
    return () => {
      URL.revokeObjectURL(imagePreview);
    };
  }, [imageFile, imagePreview]);

  const callVehicleApi = async (
    method: "POST" | "PATCH" | "DELETE",
    payload: Record<string, unknown>,
  ) => {
    if (!auth?.currentUser) {
      throw new Error(
        lang === "th"
          ? "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
          : "Please sign in again.",
      );
    }
    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/backoffice/vehicles", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        // ignore
      }
      throw new Error(data.error ?? "Request failed.");
    }
    return response.json().catch(() => ({}));
  };

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setMessage(
        lang === "th"
          ? "Firebase ยังไม่พร้อมใช้งาน"
          : "Firebase is not configured.",
      );
      return;
    }
    const firestore = db as Firestore;
    const vehicleQuery = query(
      collection(firestore, "vehicles"),
      orderBy("updatedAt", "desc"),
    );
    setServerReady(false);
    serverReadyRef.current = false;
    const unsubscribe = onSnapshot(
      vehicleQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache && !serverReadyRef.current) {
          return;
        }
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<VehicleItem, "id">),
        }));
        setItems(data);
        if (!serverReadyRef.current) {
          serverReadyRef.current = true;
          setServerReady(true);
        }
        if (
          !seededRef.current &&
          snapshot.empty &&
          user &&
          !loading
        ) {
          seededRef.current = true;
          void seedDefaultVehicles();
        }
      },
      (err) => {
        setMessage(err.message);
        serverReadyRef.current = true;
        setServerReady(true);
        setItems([]);
      },
    );
    return () => unsubscribe();
  }, [lang, loading, user]);

  useEffect(() => {
    setPage(1);
  }, [queryText, items.length]);

  const filteredItems = useMemo(() => {
    const keyword = queryText.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const values = [item.name, item.code]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return values.some((value) => value.includes(keyword));
    });
  }, [items, queryText]);

  const seedDefaultVehicles = async () => {
    try {
      await callVehicleApi("POST", { action: "seed" });
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Unable to seed vehicles.";
      setMessage(text);
      seededRef.current = false;
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImageUrl("");
    setMessage("");
    setModalOpen(true);
  };

  const openEditModal = (vehicle: VehicleItem) => {
    setEditingId(vehicle.id);
    setForm({
      name: vehicle.name ?? "",
      code: vehicle.code ?? "",
      warranty: vehicle.warranty ?? "",
      image: vehicle.image ?? "",
    });
    setImageFile(null);
    setImageUrl(vehicle.image ?? "");
    setMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setMessage("");
  };

  const handleSave = async () => {
    if (!db || !isFirebaseConfigured) {
      await showErrorAlert({
        title: "Error",
        text:
          lang === "th"
            ? "Firebase ยังไม่พร้อมใช้งาน"
            : "Firebase is not configured.",
      });
      return;
    }
    const name = form.name.trim();
    const code = form.code.trim();
    const warranty = form.warranty.trim();
    if (!name) {
      const errorText =
        lang === "th" ? "กรุณากรอกชื่อรุ่นรถ" : "Enter vehicle name.";
      setMessage(errorText);
      await showErrorAlert({ title: "Error", text: errorText });
      return;
    }
    setSaving(true);
    try {
      let finalImageUrl = imageUrl.trim() || form.image.trim();
      if (imageFile) {
        const upload = await uploadLocalFile(imageFile, "vehicles");
        finalImageUrl = upload.url;
      }
      const payload = {
        id: editingId ?? undefined,
        name,
        code,
        warranty,
        image: finalImageUrl,
        published: true,
      };
      await callVehicleApi(editingId ? "PATCH" : "POST", payload);
      await showSuccessAlert({
        title: lang === "th" ? "บันทึกรุ่นรถแล้ว" : "Vehicle saved.",
      });
      setForm(emptyForm);
      setImageFile(null);
      setImageUrl("");
      setEditingId(null);
      setModalOpen(false);
      setMessage("");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to save vehicle.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    try {
      await callVehicleApi("DELETE", { id: vehicleId });
      await showSuccessAlert({
        title: lang === "th" ? "ลบรุ่นรถแล้ว" : "Vehicle deleted.",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to delete vehicle.";
      await showErrorAlert({ title: "Error", text });
    }
  };

  const togglePublish = async (vehicle: VehicleItem) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    await callVehicleApi("PATCH", {
      id: vehicle.id,
      published: !vehicle.published,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {lang === "th" ? "รายการรุ่นรถ" : "Vehicles"}
          </div>
          <Button onClick={openAddModal}>
            {lang === "th" ? "เพิ่มรุ่นรถ" : "Add vehicle"}
          </Button>
        </div>
        <Input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder={lang === "th" ? "ค้นหารุ่นรถ" : "Search vehicles"}
        />
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-[720px] table-auto text-xs sm:w-full sm:min-w-0 sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-[--text-soft]">
                <th className="pb-2">ชื่อรุ่น</th>
                <th className="pb-2">รหัสรุ่น</th>
                <th className="pb-2">สถานะ</th>
                <th className="pb-2">อัปเดต</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-emerald-100">
                  <td className="py-2 pr-3">{vehicle.name}</td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {vehicle.code || "-"}
                  </td>
                  <td className="py-2 pr-3">
                    {vehicle.published === false
                      ? lang === "th"
                        ? "ปิดการแสดงผล"
                        : "Hidden"
                      : lang === "th"
                        ? "เผยแพร่"
                        : "Published"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {vehicle.updatedAt ? formatDateTime(vehicle.updatedAt) : "-"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(vehicle)}
                      >
                        {lang === "th" ? "แก้ไข" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(vehicle)}
                      >
                        {vehicle.published === false
                          ? lang === "th"
                            ? "เผยแพร่"
                            : "Publish"
                          : lang === "th"
                            ? "ยกเลิกเผยแพร่"
                            : "Unpublish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        {lang === "th" ? "ลบ" : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!serverReady ? (
                <tr key="loading">
                  <td
                    colSpan={5}
                    className="py-4 text-center text-xs text-[--text-soft]"
                  >
                    {lang === "th"
                      ? "กำลังโหลดข้อมูล..."
                      : "Loading vehicles..."}
                  </td>
                </tr>
              ) : !pagedItems.length ? (
                <tr key="empty">
                  <td
                    colSpan={5}
                    className="py-4 text-center text-xs text-[--text-soft]"
                  >
                    {lang === "th" ? "ยังไม่มีรุ่นรถ" : "No vehicles yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[--text-soft]">
          <div>
            {lang === "th"
              ? `แสดง ${filteredItems.length} รายการ`
              : `${filteredItems.length} items`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              {lang === "th" ? "ก่อนหน้า" : "Prev"}
            </Button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              {lang === "th" ? "ถัดไป" : "Next"}
            </Button>
          </div>
        </div>
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[--text-strong]">
                {editingId
                  ? lang === "th"
                    ? "แก้ไขรุ่นรถ"
                    : "Edit vehicle"
                  : lang === "th"
                    ? "เพิ่มรุ่นรถใหม่"
                    : "Add new vehicle"}
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-[--text-soft]"
                onClick={closeModal}
              >
                {lang === "th" ? "ปิด" : "Close"}
              </button>
            </div>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={lang === "th" ? "ชื่อรุ่นรถ" : "Vehicle name"}
            />
            <Input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder={lang === "th" ? "รหัสรุ่น (ถ้ามี)" : "Code (optional)"}
            />
            <Textarea
              value={form.warranty}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, warranty: event.target.value }))
              }
              placeholder={
                lang === "th"
                  ? "รายละเอียดการรับประกัน (ถ้ามี)"
                  : "Warranty details (optional)"
              }
              rows={4}
            />
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
              />
              {imagePreview ? (
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                  <img
                    src={imagePreview}
                    alt="Vehicle preview"
                    className="h-40 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            {message ? <div className="text-xs text-emerald-700">{message}</div> : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "..." : lang === "th" ? "บันทึก" : "Save"}
              </Button>
              <Button variant="outline" onClick={closeModal}>
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
