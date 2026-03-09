"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user || user.isAnonymous) {
      if (user?.isAnonymous) {
        void signOut();
      }
      const nextPath = encodeURIComponent(pathname ?? "/");
      const isBackoffice =
        pathname?.startsWith("/bo") || pathname?.startsWith("/backoffice");
      const loginPath = isBackoffice ? "/backoffice/login" : "/login";
      router.replace(`${loginPath}?next=${nextPath}`);
    }
  }, [loading, user, pathname, router, signOut]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[--text-soft]">
        Checking session...
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return null;
  }

  return <>{children}</>;
}
