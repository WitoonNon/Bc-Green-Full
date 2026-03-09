"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/format";
import { uploadLocalFile } from "@/lib/uploads/client";
import { promotions as seedPromotions } from "@/data/promotions";
import type { PromotionItem } from "@/types/promotion";

type FormState = {
  titleTh: string;
  subtitleTh: string;
  titleEn: string;
  subtitleEn: string;
  contentTh: string;
  contentEn: string;
};

const emptyForm: FormState = {
  titleTh: "",
  subtitleTh: "",
  titleEn: "",
  subtitleEn: "",
  contentTh: "",
  contentEn: "",
};

const PAGE_SIZE = 6;

export default function PromotionManager() {
  const { lang } = useI18n();
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const imagePreview = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return imageUrl;
  }, [imageFile, imageUrl]);

  useEffect(() => {
    if (!imageFile) return;
    return () => {
      URL.revokeObjectURL(imagePreview);
    };
  }, [imageFile, imagePreview]);

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
    const promoQuery = query(
      collection(firestore, "promotions"),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(promoQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PromotionItem, "id">),
      }));
      setItems(data);
      if (!snapshot.empty) {
        return;
      }
      const now = new Date().toISOString();
      void Promise.all(
        seedPromotions.map((promo) =>
          setDoc(
            doc(firestore, "promotions", promo.id),
            {
              ...promo,
              seed: true,
              source: "backoffice",
              createdAt: now,
              updatedAt: now,
            },
            { merge: true },
          ),
        ),
      );
    });
    return () => unsubscribe();
  }, [lang]);

  useEffect(() => {
    setPage(1);
  }, [queryText, items.length]);

  const filteredItems = useMemo(() => {
    const keyword = queryText.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const values = [
        item.title?.th,
        item.title?.en,
        item.subtitle?.th,
        item.subtitle?.en,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return values.some((value) => value.includes(keyword));
    });
  }, [items, queryText]);

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

  const openEditModal = (promo: PromotionItem) => {
    setEditingId(promo.id);
    setForm({
      titleTh: promo.title.th ?? "",
      subtitleTh: promo.subtitle.th ?? "",
      titleEn: promo.title.en ?? "",
      subtitleEn: promo.subtitle.en ?? "",
      contentTh: promo.content?.th ?? "",
      contentEn: promo.content?.en ?? "",
    });
    setImageFile(null);
    setImageUrl(promo.image ?? "");
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
    if (!form.titleTh.trim() || !form.subtitleTh.trim()) {
      const errorText =
        lang === "th"
          ? "กรุณากรอกชื่อและคำอธิบายโปรโมชัน"
          : "Please fill in promotion title and subtitle.";
      setMessage(errorText);
      await showErrorAlert({ title: "Error", text: errorText });
      return;
    }
    if (!imageFile && !imageUrl) {
      const errorText =
        lang === "th" ? "กรุณาอัปโหลดรูปภาพ" : "Please upload an image.";
      setMessage(errorText);
      await showErrorAlert({ title: "Error", text: errorText });
      return;
    }

    setSaving(true);
    try {
      const firestore = db as Firestore;
      const now = new Date().toISOString();
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const upload = await uploadLocalFile(imageFile, "promotions");
        finalImageUrl = upload.url;
      }
      const payload = {
        title: { th: form.titleTh, en: form.titleEn },
        subtitle: { th: form.subtitleTh, en: form.subtitleEn },
        content: { th: form.contentTh, en: form.contentEn },
        image: finalImageUrl,
        published: true,
        source: "backoffice",
        updatedAt: now,
      };
      if (editingId) {
        await updateDoc(doc(firestore, "promotions", editingId), payload);
      } else {
        await addDoc(collection(firestore, "promotions"), {
          ...payload,
          createdAt: now,
        });
      }
      await showSuccessAlert({
        title: lang === "th" ? "บันทึกโปรโมชันแล้ว" : "Promotion saved.",
      });
      setForm(emptyForm);
      setImageFile(null);
      setImageUrl("");
      setEditingId(null);
      setModalOpen(false);
      setMessage("");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to save promotion.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    try {
      const firestore = db as Firestore;
      await deleteDoc(doc(firestore, "promotions", promoId));
      await showSuccessAlert({
        title: lang === "th" ? "ลบโปรโมชันแล้ว" : "Promotion deleted.",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to delete promotion.";
      await showErrorAlert({ title: "Error", text });
    }
  };

  const togglePublish = async (promo: PromotionItem) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    await updateDoc(doc(firestore, "promotions", promo.id), {
      published: !promo.published,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {lang === "th" ? "รายการโปรโมชัน" : "Promotions"}
          </div>
          <Button onClick={openAddModal}>
            {lang === "th" ? "เพิ่มโปรโมชัน" : "Add promotion"}
          </Button>
        </div>
        <Input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder={lang === "th" ? "ค้นหาโปรโมชัน" : "Search promotions"}
        />
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-[900px] table-auto text-xs sm:w-full sm:min-w-0 sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-[--text-soft]">
                <th className="pb-2">รูป</th>
                <th className="pb-2">ชื่อโปรโมชัน</th>
                <th className="pb-2">คำอธิบาย</th>
                <th className="pb-2">สถานะ</th>
                <th className="pb-2">อัปเดต</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((promo) => (
                <tr key={promo.id} className="border-t border-emerald-100">
                  <td className="py-2 pr-3">
                    {promo.image ? (
                      <img
                        src={promo.image}
                        alt={lang === "th" ? promo.title.th : promo.title.en}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {lang === "th" ? promo.title.th : promo.title.en}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {lang === "th" ? promo.subtitle.th : promo.subtitle.en}
                  </td>
                  <td className="py-2 pr-3">
                    {promo.published === false
                      ? lang === "th"
                        ? "ปิดการแสดงผล"
                        : "Hidden"
                      : lang === "th"
                        ? "เผยแพร่"
                        : "Published"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {promo.updatedAt ? formatDateTime(promo.updatedAt) : "-"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(promo)}
                      >
                        {lang === "th" ? "แก้ไข" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(promo)}
                      >
                        {promo.published === false
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
                        onClick={() => handleDelete(promo.id)}
                      >
                        {lang === "th" ? "ลบ" : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pagedItems.length ? (
                <tr key="empty">
                  <td
                    colSpan={6}
                    className="py-4 text-center text-xs text-[--text-soft]"
                  >
                    {lang === "th" ? "ยังไม่มีโปรโมชัน" : "No promotions yet."}
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
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[--text-strong]">
                {editingId
                  ? lang === "th"
                    ? "แก้ไขโปรโมชัน"
                    : "Edit promotion"
                  : lang === "th"
                    ? "เพิ่มโปรโมชันใหม่"
                    : "Add promotion"}
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
              value={form.titleTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, titleTh: event.target.value }))
              }
              placeholder={lang === "th" ? "ชื่อโปรโมชัน (TH)" : "Title (TH)"}
            />
            <Textarea
              value={form.subtitleTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subtitleTh: event.target.value }))
              }
              placeholder={lang === "th" ? "คำอธิบาย (TH)" : "Subtitle (TH)"}
            />
            <Input
              value={form.titleEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, titleEn: event.target.value }))
              }
              placeholder={lang === "th" ? "ชื่อโปรโมชัน (EN)" : "Title (EN)"}
            />
            <Textarea
              value={form.subtitleEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subtitleEn: event.target.value }))
              }
              placeholder={lang === "th" ? "คำอธิบาย (EN)" : "Subtitle (EN)"}
            />
            <Textarea
              value={form.contentTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contentTh: event.target.value }))
              }
              placeholder={lang === "th" ? "รายละเอียด (TH)" : "Content (TH)"}
              rows={4}
            />
            <Textarea
              value={form.contentEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contentEn: event.target.value }))
              }
              placeholder={lang === "th" ? "รายละเอียด (EN)" : "Content (EN)"}
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
                    alt="Promotion preview"
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
