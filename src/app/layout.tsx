import type { Metadata } from "next";
import { Chakra_Petch, Kanit } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

const brandFont = Chakra_Petch({
  variable: "--font-brand",
  subsets: ["latin", "thai"],
  weight: ["400", "600", "700"],
});

const bodyFont = Kanit({
  variable: "--font-body",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BC Service",
  description: "Repair requests, status tracking, and support center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${brandFont.variable} ${bodyFont.variable} antialiased`}>
        <AuthProvider><I18nProvider>{children}</I18nProvider></AuthProvider>
      </body>
    </html>
  );
}
