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
import type { AnnouncementItem } from "@/types/announcement";

type FormState = {
  titleTh: string;
  detailTh: string;
  titleEn: string;
  detailEn: string;
  date: string;
};

const emptyForm: FormState = {
  titleTh: "",
  detailTh: "",
  titleEn: "",
  detailEn: "",
  date: "",
};

const PAGE_SIZE = 6;

export default function AnnouncementManager() {
  const { lang } = useI18n();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return imageUrl;
  }, [imageFile, imageUrl]);

  useEffect(() => {
    if (!imageFile) return;
    return () => URL.revokeObjectURL(imagePreview);
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
    const announcementQuery = query(
      collection(firestore, "announcements"),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      announcementQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const payload = docSnap.data() as Omit<AnnouncementItem, "id"> & {
            source?: string;
            seed?: boolean;
          };
          if (!payload.source && payload.seed !== true) {
            void updateDoc(doc(firestore, "announcements", docSnap.id), {
              source: "backoffice",
              updatedAt: new Date().toISOString(),
            });
          }
          return {
            id: docSnap.id,
            ...payload,
          };
        });
        setItems(data);
      },
      (err) => setMessage(err.message),
    );
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
        item.detail?.th,
        item.detail?.en,
        item.date,
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

  const openEditModal = (announcement: AnnouncementItem) => {
    setEditingId(announcement.id);
    setForm({
      titleTh: announcement.title?.th ?? "",
      detailTh: announcement.detail?.th ?? "",
      titleEn: announcement.title?.en ?? "",
      detailEn: announcement.detail?.en ?? "",
      date: announcement.date ?? "",
    });
    setImageFile(null);
    setImageUrl(announcement.image ?? "");
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
    const titleTh = form.titleTh.trim();
    const titleEn = form.titleEn.trim();
    const detailTh = form.detailTh.trim();
    const detailEn = form.detailEn.trim();
    const date = form.date.trim();
    if (!titleTh || !detailTh || !date) {
      const errorText =
        lang === "th"
          ? "กรุณากรอกข้อมูลประกาศให้ครบ"
          : "Please complete the announcement fields.";
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
        title: { th: titleTh, en: titleEn || titleTh },
        detail: { th: detailTh, en: detailEn || detailTh },
        date,
        image: finalImageUrl,
        published: true,
        source: "backoffice",
        updatedAt: now,
      };
      if (editingId) {
        await updateDoc(doc(firestore, "announcements", editingId), payload);
      } else {
        await addDoc(collection(firestore, "announcements"), {
          ...payload,
          createdAt: now,
        });
      }
      await showSuccessAlert({
        title: lang === "th" ? "บันทึกประกาศแล้ว" : "Announcement saved.",
      });
      setForm(emptyForm);
      setImageFile(null);
      setImageUrl("");
      setEditingId(null);
      setModalOpen(false);
      setMessage("");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to save announcement.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    try {
      const firestore = db as Firestore;
      await deleteDoc(doc(firestore, "announcements", announcementId));
      await showSuccessAlert({
        title: lang === "th" ? "ลบประกาศแล้ว" : "Announcement deleted.",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to delete announcement.";
      await showErrorAlert({ title: "Error", text });
    }
  };

  const togglePublish = async (announcement: AnnouncementItem) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    await updateDoc(doc(firestore, "announcements", announcement.id), {
      published: !announcement.published,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {lang === "th" ? "รายการประกาศ" : "Announcements"}
          </div>
          <Button onClick={openAddModal}>
            {lang === "th" ? "เพิ่มประกาศ" : "Add announcement"}
          </Button>
        </div>
        <Input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder={lang === "th" ? "ค้นหาประกาศ" : "Search announcements"}
        />
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-[860px] table-auto text-xs sm:w-full sm:min-w-0 sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-[--text-soft]">
                <th className="pb-2">รูป</th>
                <th className="pb-2">วันที่</th>
                <th className="pb-2">หัวข้อ</th>
                <th className="pb-2">รายละเอียด</th>
                <th className="pb-2">สถานะ</th>
                <th className="pb-2">อัปเดต</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((announcement) => (
                <tr key={announcement.id} className="border-t border-emerald-100">
                  <td className="py-2 pr-3">
                    {announcement.image ? (
                      <img
                        src={announcement.image}
                        alt="Announcement"
                        className="h-10 w-12 rounded object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {announcement.date}
                  </td>
                  <td className="py-2 pr-3">
                    {lang === "th" ? announcement.title.th : announcement.title.en}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {lang === "th" ? announcement.detail.th : announcement.detail.en}
                  </td>
                  <td className="py-2 pr-3">
                    {announcement.published === false
                      ? lang === "th"
                        ? "ปิดการแสดงผล"
                        : "Hidden"
                      : lang === "th"
                        ? "เผยแพร่"
                        : "Published"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {announcement.updatedAt
                      ? formatDateTime(announcement.updatedAt)
                      : "-"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(announcement)}
                      >
                        {lang === "th" ? "แก้ไข" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(announcement)}
                      >
                        {announcement.published === false
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
                        onClick={() => handleDelete(announcement.id)}
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
                    {lang === "th" ? "ยังไม่มีประกาศ" : "No announcements yet."}
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
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[--text-strong]">
                {editingId
                  ? lang === "th"
                    ? "แก้ไขประกาศ"
                    : "Edit announcement"
                  : lang === "th"
                    ? "เพิ่มประกาศใหม่"
                    : "Add announcement"}
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
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
            <Input
              value={form.titleTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, titleTh: event.target.value }))
              }
              placeholder={lang === "th" ? "หัวข้อประกาศ (TH)" : "Title (TH)"}
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
                <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            <Textarea
              value={form.detailTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, detailTh: event.target.value }))
              }
              placeholder={lang === "th" ? "รายละเอียด (TH)" : "Detail (TH)"}
            />
            <Input
              value={form.titleEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, titleEn: event.target.value }))
              }
              placeholder={lang === "th" ? "หัวข้อประกาศ (EN)" : "Title (EN)"}
            />
            <Textarea
              value={form.detailEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, detailEn: event.target.value }))
              }
              placeholder={lang === "th" ? "รายละเอียด (EN)" : "Detail (EN)"}
            />
            {message ? (
              <div className="text-xs text-emerald-700">{message}</div>
            ) : null}
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
