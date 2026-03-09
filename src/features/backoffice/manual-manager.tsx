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
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { uploadLocalFile } from "@/lib/uploads/client";
import { manuals as seedManuals } from "@/data/support";
import type { ManualItem } from "@/types/support";

type FormState = {
  titleTh: string;
  summaryTh: string;
  titleEn: string;
  summaryEn: string;
  link: string;
};

const emptyForm: FormState = {
  titleTh: "",
  summaryTh: "",
  titleEn: "",
  summaryEn: "",
  link: "",
};

export default function ManualManager() {
  const { lang } = useI18n();
  const [items, setItems] = useState<ManualItem[]>(seedManuals);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

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
      return;
    }
    const firestore = db as Firestore;
    const manualQuery = query(
      collection(firestore, "manuals"),
      orderBy("updatedAt", "desc"),
    );
    const unsubscribe = onSnapshot(manualQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ManualItem, "id">),
      }));
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!db || !isFirebaseConfigured) {
      setMessage(lang === "th" ? "Firebase ยังไม่พร้อมใช้งาน" : "Firebase is not configured.");
      return;
    }
    const firestore = db as Firestore;
    setSaving(true);
    try {
      setMessage("");
      const now = new Date().toISOString();
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const upload = await uploadLocalFile(imageFile, "repairs");
        finalImageUrl = upload.url;
      }

      await addDoc(collection(firestore, "manuals"), {
        title: { th: form.titleTh, en: form.titleEn },
        summary: { th: form.summaryTh, en: form.summaryEn },
        link: form.link,
        image: finalImageUrl,
        published: true,
        updatedAt: now,
      });
      setForm(emptyForm);
      setImageFile(null);
      setImageUrl("");
      setMessage(lang === "th" ? "เพิ่มคู่มือแล้ว" : "Manual added.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (manualId: string) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    await deleteDoc(doc(firestore, "manuals", manualId));
  };

  const togglePublish = async (manual: ManualItem) => {
    if (!db || !isFirebaseConfigured) {
      return;
    }
    const firestore = db as Firestore;
    await updateDoc(doc(firestore, "manuals", manual.id), {
      published: !manual.published,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="text-sm font-semibold text-[--text-strong]">
          {lang === "th" ? "เพิ่มคู่มือใหม่" : "Add new manual"}
        </div>
        <Input
          value={form.titleTh}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, titleTh: event.target.value }))
          }
          placeholder={lang === "th" ? "หัวข้อ (TH)" : "Title (TH)"}
        />
        <Textarea
          value={form.summaryTh}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, summaryTh: event.target.value }))
          }
          placeholder={lang === "th" ? "สรุป (TH)" : "Summary (TH)"}
        />
        <Input
          value={form.titleEn}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, titleEn: event.target.value }))
          }
          placeholder={lang === "th" ? "หัวข้อ (EN)" : "Title (EN)"}
        />
        <Textarea
          value={form.summaryEn}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, summaryEn: event.target.value }))
          }
          placeholder={lang === "th" ? "สรุป (EN)" : "Summary (EN)"}
        />
        <Input
          value={form.link}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, link: event.target.value }))
          }
          placeholder={lang === "th" ? "ลิงก์ไฟล์หรือ PDF" : "Link / PDF URL"}
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
        {message ? <div className="text-xs text-emerald-700">{message}</div> : null}
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "..." : lang === "th" ? "บันทึกคู่มือ" : "Save manual"}
        </Button>
      </Card>
      <div className="space-y-3">
        {items.map((manual) => (
          <Card key={manual.id} className="space-y-2">
            <div className="flex gap-3">
              {manual.image && (
                <img
                  src={manual.image}
                  className="h-16 w-20 rounded object-cover"
                  alt="Manual cover"
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-[--text-strong]">
                  {lang === "th" ? manual.title.th : manual.title.en}
                </div>
              </div>
            </div>
            <div className="text-xs text-[--text-soft]">
              {lang === "th" ? manual.summary.th : manual.summary.en}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePublish(manual)}
              >
                {manual.published
                  ? lang === "th"
                    ? "ยกเลิกเผยแพร่"
                    : "Unpublish"
                  : lang === "th"
                    ? "เผยแพร่"
                    : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(manual.id)}
              >
                {lang === "th" ? "ลบ" : "Delete"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
