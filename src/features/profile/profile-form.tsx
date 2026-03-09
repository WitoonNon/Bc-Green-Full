"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { buildProfileFromUser, getMockProfile } from "@/lib/user-profile";
import type { UserProfile } from "@/types/user";

function displayValue(value?: string) {
  return value && value.trim() ? value : "-";
}

export default function ProfileForm() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (!user) {
      setProfile(null);
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setProfile(getMockProfile(user) || buildProfileFromUser(user));
      return;
    }
    const firestore = db as Firestore;
    const ref = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(buildProfileFromUser(user, snapshot.data()));
        } else {
          setProfile(buildProfileFromUser(user));
        }
      },
      (err) => setError(err.message),
    );
    return () => unsubscribe();
  }, [user]);

  const addressLine = useMemo(
    () => displayValue(profile?.address.line1),
    [profile],
  );
  const addressMeta = useMemo(() => {
    const district = profile?.address.district?.trim() ?? "";
    const province = profile?.address.province?.trim() ?? "";
    const zip = profile?.address.zip?.trim() ?? "";
    const parts = [district, province, zip].filter(Boolean);
    return parts.length ? parts.join(" / ") : "-";
  }, [profile]);

  if (!user) {
    return <p className="text-sm text-[--text-soft]">Please sign in first.</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!profile) {
    return (
      <p className="text-sm text-[--text-soft]">Loading profile...</p>
    );
  }

  const displayName = displayValue(profile.displayName);
  const email = displayValue(profile.email);
  const phone = displayValue(profile.phone);
  const initials =
    displayName && displayName !== "-"
      ? displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      : "BC";

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/80 bg-white/80">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          )}
        </div>
        <div>
          <div className="text-lg font-semibold text-[--text-strong]">
            {displayName}
          </div>
          <div className="text-xs text-[--text-soft]">{email}</div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {t("profile.editName")}
          </div>
          <div className="space-y-2 text-sm text-[--text-strong]">
            <div>
              <div className="text-xs text-[--text-soft]">
                {t("auth.displayName")}
              </div>
              <div className="font-medium">{displayName}</div>
            </div>
            <div>
              <div className="text-xs text-[--text-soft]">
                {t("fields.contactPhone")}
              </div>
              <div className="font-medium">{phone}</div>
            </div>
            <div>
              <div className="text-xs text-[--text-soft]">{t("auth.email")}</div>
              <div className="font-medium">{email}</div>
            </div>
          </div>
        </Card>
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-[--text-strong]">
            {t("profile.editAddress")}
          </div>
          <div className="space-y-1 text-sm text-[--text-strong]">
            <div className="font-medium">{addressLine}</div>
            <div className="text-xs text-[--text-soft]">{addressMeta}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
