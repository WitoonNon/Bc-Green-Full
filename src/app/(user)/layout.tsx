import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import UserFrame from "@/components/sections/user-frame";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <UserFrame>{children}</UserFrame>
    </AuthGuard>
  );
}
