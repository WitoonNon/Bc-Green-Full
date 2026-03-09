import type { User } from "firebase/auth";
import type { UserProfile, UserAddress } from "@/types/user";

export const emptyAddress: UserAddress = {
  line1: "",
  district: "",
  province: "",
  zip: "",
};

export function buildProfileFromUser(
  user: User,
  data?: Record<string, unknown>,
): UserProfile {
  const address = (data?.address as Record<string, unknown>) ?? emptyAddress;
  return {
    id: user.uid,
    displayName: String(data?.displayName ?? user.displayName ?? user.email ?? ""),
    email: String(data?.email ?? user.email ?? ""),
    phone: String(data?.phone ?? ""),
    avatarUrl: data?.avatarUrl ? String(data.avatarUrl) : undefined,
    address: {
      line1: String(address.line1 ?? ""),
      district: String(address.district ?? ""),
      province: String(address.province ?? ""),
      zip: String(address.zip ?? ""),
    },
    role: data?.role as UserProfile["role"],
  };
}

export function saveMockProfile(uid: string, profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`bc_mock_profile_${uid}`, JSON.stringify(profile));
}

export function getMockProfile(user: User): UserProfile | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(`bc_mock_profile_${user.uid}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}
