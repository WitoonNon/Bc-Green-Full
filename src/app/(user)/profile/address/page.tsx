"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import PageHeader from "@/components/sections/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { buildProfileFromUser, emptyAddress } from "@/lib/user-profile";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import type { UserAddress } from "@/types/user";

export default function ProfileAddressPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [initialAddress, setInitialAddress] = useState<UserAddress | null>(null);
  const [hasDoc, setHasDoc] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setHydrated(false);
    if (!user) {
      setAddress(null);
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setAddress(emptyAddress);
      setInitialAddress(emptyAddress);
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
        setHasDoc(snapshot.exists());
        setInitialAddress(nextProfile.address);
        if (!hydrated) {
          setAddress(nextProfile.address);
          setHydrated(true);
        }
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !address || !db || !isFirebaseConfigured) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const firestore = db as Firestore;
      const ref = doc(firestore, "users", user.uid);
      const payload = {
        address: {
          line1: address.line1.trim(),
          district: address.district.trim(),
          province: address.province.trim(),
          zip: address.zip.trim(),
        },
        updatedAt: new Date().toISOString(),
      };
      if (hasDoc) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, {
          ...payload,
          displayName: user.displayName ?? user.email ?? "",
          email: user.email ?? "",
          phone: "",
          role: "user",
          createdAt: new Date().toISOString(),
        });
      }
      await showSuccessAlert({
        title: t("actions.save"),
        text: lang === "th" ? "บันทึกที่อยู่เรียบร้อย" : "Address saved.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save address.";
      setError(message);
      await showErrorAlert({ title: "Error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAddress(initialAddress ?? emptyAddress);
    router.push("/profile");
  };

  if (!user) {
    return <p className="text-sm text-[--text-soft]">Please sign in first.</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!address) {
    return <p className="text-sm text-[--text-soft]">Loading address...</p>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("profile.editAddressAction")}
        subtitle={t("profile.subtitle")}
        backHref="/profile"
      />
      <Card className="space-y-3">
        <Textarea
          value={address.line1}
          onChange={(event) =>
            setAddress((prev) =>
              prev ? { ...prev, line1: event.target.value } : prev,
            )
          }
          placeholder={t("profile.editAddress")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={address.district}
            onChange={(event) =>
              setAddress((prev) =>
                prev ? { ...prev, district: event.target.value } : prev,
              )
            }
          placeholder={lang === "th" ? "เขต/อำเภอ" : "District"}
          />
          <Input
            value={address.province}
            onChange={(event) =>
              setAddress((prev) =>
                prev ? { ...prev, province: event.target.value } : prev,
              )
            }
            placeholder={lang === "th" ? "จังหวัด" : "Province"}
          />
        </div>
        <Input
          value={address.zip}
          onChange={(event) =>
            setAddress((prev) =>
              prev ? { ...prev, zip: event.target.value } : prev,
            )
          }
          placeholder={lang === "th" ? "รหัสไปรษณีย์" : "Zip code"}
        />
        <div className="flex gap-2">
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
