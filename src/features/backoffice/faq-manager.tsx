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
import type { FaqItem } from "@/types/support";

type FormState = {
  questionTh: string;
  answerTh: string;
  questionEn: string;
  answerEn: string;
  tags: string;
};

const emptyForm: FormState = {
  questionTh: "",
  answerTh: "",
  questionEn: "",
  answerEn: "",
  tags: "",
};

const PAGE_SIZE = 6;

export default function FaqManager() {
  const { lang } = useI18n();
  const [items, setItems] = useState<FaqItem[]>([]);
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
    const faqQuery = query(
      collection(firestore, "faqs"),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      faqQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FaqItem, "id">),
        }));
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
        item.question?.th,
        item.question?.en,
        item.answer?.th,
        item.answer?.en,
        item.tags?.join(", "),
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

  const openEditModal = (faq: FaqItem) => {
    setEditingId(faq.id);
    setForm({
      questionTh: faq.question.th ?? "",
      answerTh: faq.answer.th ?? "",
      questionEn: faq.question.en ?? "",
      answerEn: faq.answer.en ?? "",
      tags: faq.tags.join(", "),
    });
    setImageFile(null);
    setImageUrl(faq.image ?? "");
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
    if (!form.questionTh.trim() || !form.answerTh.trim()) {
      const errorText =
        lang === "th" ? "กรุณากรอกคำถามและคำตอบ" : "Please fill in the FAQ.";
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
        const upload = await uploadLocalFile(imageFile, "tickets");
        finalImageUrl = upload.url;
      }
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        question: { th: form.questionTh, en: form.questionEn },
        answer: { th: form.answerTh, en: form.answerEn },
        tags,
        image: finalImageUrl,
        updatedAt: now,
      };
      if (editingId) {
        await updateDoc(doc(firestore, "faqs", editingId), payload);
      } else {
        await addDoc(collection(firestore, "faqs"), {
          ...payload,
          published: true,
        });
      }
      await showSuccessAlert({
        title: lang === "th" ? "บันทึก FAQ แล้ว" : "FAQ saved.",
      });
      setForm(emptyForm);
      setImageFile(null);
      setImageUrl("");
      setEditingId(null);
      setModalOpen(false);
      setMessage("");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to save FAQ.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    try {
      const firestore = db as Firestore;
      await deleteDoc(doc(firestore, "faqs", faqId));
      await showSuccessAlert({
        title: lang === "th" ? "ลบ FAQ แล้ว" : "FAQ deleted.",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to delete FAQ.";
      await showErrorAlert({ title: "Error", text });
    }
  };

  const togglePublish = async (faq: FaqItem) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    await updateDoc(doc(firestore, "faqs", faq.id), {
      published: !faq.published,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {lang === "th" ? "รายการ FAQ" : "FAQ"}
          </div>
          <Button onClick={openAddModal}>
            {lang === "th" ? "เพิ่ม FAQ" : "Add FAQ"}
          </Button>
        </div>
        <Input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder={lang === "th" ? "ค้นหา FAQ" : "Search FAQ"}
        />
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-[920px] table-auto text-xs sm:w-full sm:min-w-0 sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-[--text-soft]">
                <th className="pb-2">รูป</th>
                <th className="pb-2">คำถาม</th>
                <th className="pb-2">คำตอบ</th>
                <th className="pb-2">แท็ก</th>
                <th className="pb-2">สถานะ</th>
                <th className="pb-2">อัปเดต</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((faq) => (
                <tr key={faq.id} className="border-t border-emerald-100">
                  <td className="py-2 pr-3">
                    {faq.image ? (
                      <img
                        src={faq.image}
                        alt="FAQ"
                        className="h-10 w-12 rounded object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {lang === "th" ? faq.question.th : faq.question.en}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {lang === "th" ? faq.answer.th : faq.answer.en}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {faq.tags.join(", ") || "-"}
                  </td>
                  <td className="py-2 pr-3">
                    {faq.published === false
                      ? lang === "th"
                        ? "ปิดการแสดงผล"
                        : "Hidden"
                      : lang === "th"
                        ? "เผยแพร่"
                        : "Published"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[--text-soft]">
                    {faq.updatedAt ? formatDateTime(faq.updatedAt) : "-"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(faq)}
                      >
                        {lang === "th" ? "แก้ไข" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(faq)}
                      >
                        {faq.published === false
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
                        onClick={() => handleDelete(faq.id)}
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
                    {lang === "th" ? "ยังไม่มี FAQ" : "No FAQ yet."}
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
                    ? "แก้ไข FAQ"
                    : "Edit FAQ"
                  : lang === "th"
                    ? "เพิ่ม FAQ ใหม่"
                    : "Add FAQ"}
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
              value={form.questionTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, questionTh: event.target.value }))
              }
              placeholder={lang === "th" ? "คำถาม (TH)" : "Question (TH)"}
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
              value={form.answerTh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, answerTh: event.target.value }))
              }
              placeholder={lang === "th" ? "คำตอบ (TH)" : "Answer (TH)"}
            />
            <Input
              value={form.questionEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, questionEn: event.target.value }))
              }
              placeholder={lang === "th" ? "คำถาม (EN)" : "Question (EN)"}
            />
            <Textarea
              value={form.answerEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, answerEn: event.target.value }))
              }
              placeholder={lang === "th" ? "คำตอบ (EN)" : "Answer (EN)"}
            />
            <Input
              value={form.tags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tags: event.target.value }))
              }
              placeholder={lang === "th" ? "แท็ก (คั่นด้วย ,)" : "Tags (comma separated)"}
            />
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
