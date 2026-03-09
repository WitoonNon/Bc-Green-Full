import type { ReactNode } from "react";
import BottomNav from "@/components/sections/bottom-nav";
import TopBar from "@/components/sections/top-bar";

type UserFrameProps = {
  children: ReactNode;
};

export default function UserFrame({ children }: UserFrameProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_rgba(224,246,200,0.95))]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <TopBar />
        <main className="mt-6 space-y-6 pb-24 lg:pb-0">{children}</main>
      </div>
      <BottomNav className="lg:hidden" />
    </div>
  );
}
