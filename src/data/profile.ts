import type { UserProfile } from "@/types/user";

export const mockProfile: UserProfile = {
  id: "user-001",
  displayName: "ณัฐธิดา พงษ์ศรี",
  email: "user@bcservice.co",
  phone: "093-000-0000",
  address: {
    line1: "12/5 ถนนประชาชื่น",
    district: "บางซื่อ",
    province: "กรุงเทพมหานคร",
    zip: "10800",
  },
  role: "user",
};
