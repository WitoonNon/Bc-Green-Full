"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import PageHeader from "@/components/sections/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { buildProfileFromUser, emptyAddress, getMockProfile, saveMockProfile } from "@/lib/user-profile";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { uploadLocalFile } from "@/lib/uploads/client";
import type { UserProfile } from "@/types/user";

export default function ProfileEditPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [hasDoc, setHasDoc] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError("");
    setHydrated(false);
    if (!user) {
      setProfile(null);
      setForm(null);
      return;
    }
    if (!db || !isFirebaseConfigured) {
      const nextProfile = getMockProfile(user) || buildProfileFromUser(user);
      setProfile(nextProfile);
      setForm(nextProfile);
      setHydrated(true);
      return;
    }
    const firestore = db as Firestore;
    const ref = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const nextProfile = snapshot.exists()
          ? buildProfileFromUser(user, snapshot.data())
          : buildProfileFromUser(user);
        setProfile(nextProfile);
        setHasDoc(snapshot.exists());
        if (!hydrated) {
          setForm(nextProfile);
          setAvatarFile(null);
          setHydrated(true);
        }
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return form?.avatarUrl ?? "";
  }, [avatarFile, form?.avatarUrl]);

  useEffect(() => {
    if (!avatarFile) return;
    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  const handleSave = async () => {
    if (!user || !form) {
      return;
    }

    if (!form.displayName.trim() || !form.phone.trim() || !form.email.trim() || !form.address.line1.trim() || !form.address.district.trim() || !form.address.province.trim() || !form.address.zip.trim()) {
      const msg = lang === "th" ? "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน" : t("auth.fillAllFields");
      setError(msg);
      await showErrorAlert({ title: "Error", text: msg });
      return;
    }

    setSaving(true);
    setError("");

    if (!db || !isFirebaseConfigured) {
      // Mock saving for local demo without Firebase
      const updatedForm = { ...form, avatarUrl: avatarPreview || form.avatarUrl };
      saveMockProfile(user.uid, updatedForm);
      setTimeout(async () => {
        await showSuccessAlert({
          title: t("actions.save"),
          text: lang === "th" ? "บันทึกข้อมูลจำลองเรียบร้อย (Demo)" : "Profile mock saved.",
        });
        setSaving(false);
        router.push("/profile");
      }, 500);
      return;
    }

    try {
      const firestore = db as Firestore;
      const ref = doc(firestore, "users", user.uid);
      let avatarUrl = form.avatarUrl || "";
      if (avatarFile) {
        const upload = await uploadLocalFile(avatarFile, "avatars");
        avatarUrl = upload.url;
      }
      const payload = {
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        avatarUrl,
        address: {
          line1: form.address.line1.trim(),
          district: form.address.district.trim(),
          province: form.address.province.trim(),
          zip: form.address.zip.trim(),
        },
        updatedAt: new Date().toISOString(),
      };
      if (hasDoc) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, {
          ...payload,
          role: "user",
          createdAt: new Date().toISOString(),
        });
      }
      await showSuccessAlert({
        title: t("actions.save"),
        text: lang === "th" ? "บันทึกข้อมูลเรียบร้อย" : "Profile saved.",
      });
      setAvatarFile(null);
      router.push("/profile");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save profile.";
      setError(message);
      await showErrorAlert({ title: "Error", text: message });
    } finally {
      setSaving(false);
    }
    router.push("/profile");
  };

  const handleCancel = () => {
    if (profile) {
      setForm(profile);
    }
    setAvatarFile(null);
    router.push("/profile");
  };

  if (!user) {
    return <p className="text-sm text-[--text-soft]">Please sign in first.</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!form) {
    return <p className="text-sm text-[--text-soft]">Loading profile...</p>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("profile.editNameAction")}
        subtitle={t("profile.subtitle")}
        backHref="/profile"
      />
      <Card className="space-y-3">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[--text-mid]">
            {lang === "th" ? "รูปโปรไฟล์" : "Profile photo"}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Avatar with overlay buttons */}
            <div className="relative h-20 w-20 group">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-200 bg-white">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={form.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-200 bg-emerald-50">
                    {form.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              {/* Edit button */}
              <label
                className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
                title={lang === "th" ? "เปลี่ยนรูป" : "Change photo"}
              >
                <span className="text-xs leading-none">✏️</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    setAvatarFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              {/* Remove button */}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setForm((prev) => prev ? { ...prev, avatarUrl: "" } : prev);
                  }}
                  className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors text-xs font-bold"
                  title={lang === "th" ? "ลบรูป" : "Remove photo"}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs text-[--text-soft]">
              {avatarPreview
                ? (lang === "th" ? "กด ✏️ เพื่อเปลี่ยนรูป หรือ ✕ เพื่อลบ" : "Press ✏️ to change or ✕ to remove")
                : (lang === "th" ? "กด ✏️ เพื่อเพิ่มรูปโปรไฟล์" : "Press ✏️ to add a profile photo")}
            </div>
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-emerald-100">
          <div className="text-sm font-semibold text-emerald-700">
            {lang === "th" ? "ข้อมูลติดต่อ" : "Contact Information"}
          </div>
          <div>
            <div className="text-xs text-[--text-soft] mb-1">{t("auth.displayName")} <span className="text-rose-500">*</span></div>
            <Input
              value={form.displayName}
              onChange={(event) =>
                setForm((prev) =>
                  prev ? { ...prev, displayName: event.target.value } : prev,
                )
              }
              placeholder={t("auth.displayName")}
            />
          </div>
          <div>
            <div className="text-xs text-[--text-soft] mb-1">{t("fields.contactPhone")} <span className="text-rose-500">*</span></div>
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) =>
                  prev ? { ...prev, phone: event.target.value } : prev,
                )
              }
              placeholder={t("fields.contactPhone")}
            />
          </div>
          <div>
            <div className="text-xs text-[--text-soft] mb-1">{t("auth.email")} <span className="text-rose-500">*</span></div>
            <Input
              value={form.email}
              onChange={(event) =>
                setForm((prev) =>
                  prev ? { ...prev, email: event.target.value } : prev,
                )
              }
              placeholder={t("auth.email")}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-emerald-100">
          <div className="text-sm font-semibold text-emerald-700">
            {lang === "th" ? "ที่อยู่ (สำหรับการจัดส่งและเข้าซ่อม)" : "Address"}
          </div>
          <div>
            <div className="text-xs text-[--text-soft] mb-1">{lang === "th" ? "รายละเอียดที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)" : "Address details"} <span className="text-rose-500">*</span></div>
            <Input
              value={form.address.line1}
              onChange={(event) =>
                setForm((prev) =>
                  prev ? { ...prev, address: { ...prev.address, line1: event.target.value } } : prev,
                )
              }
              placeholder={lang === "th" ? "บ้านเลขที่, อาคาร, ซอย, ถนน..." : "House no, Building, Street..."}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-[--text-soft] mb-1">{lang === "th" ? "เขต / อำเภอ" : "District"} <span className="text-rose-500">*</span></div>
              <Input
                value={form.address.district}
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, address: { ...prev.address, district: event.target.value } } : prev,
                  )
                }
                placeholder={lang === "th" ? "เขต / อำเภอ" : "District"}
              />
            </div>
            <div>
              <div className="text-xs text-[--text-soft] mb-1">{lang === "th" ? "จังหวัด" : "Province"} <span className="text-rose-500">*</span></div>
              <Input
                value={form.address.province}
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, address: { ...prev.address, province: event.target.value } } : prev,
                  )
                }
                placeholder={lang === "th" ? "จังหวัด" : "Province"}
              />
            </div>
          </div>
          <div>
            <div className="text-xs text-[--text-soft] mb-1">{lang === "th" ? "รหัสไปรษณีย์" : "Zip Code"} <span className="text-rose-500">*</span></div>
            <Input
              value={form.address.zip}
              onChange={(event) =>
                setForm((prev) =>
                  prev ? { ...prev, address: { ...prev.address, zip: event.target.value } } : prev,
                )
              }
              placeholder={lang === "th" ? "รหัสไปรษณีย์" : "Zip code"}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "..." : t("actions.save")}
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            {t("actions.cancel")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
