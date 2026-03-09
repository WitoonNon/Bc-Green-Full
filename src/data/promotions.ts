import type { PromotionItem } from "@/types/promotion";

export const promotions: PromotionItem[] = [
  {
    id: "promo-1",
    title: { th: "ตรวจเช็กฟรีทุกเดือน", en: "Free service checkup" },
    subtitle: {
      th: "ตรวจเช็กแบตเตอรี่และตัวรถฟรีทุกเดือน",
      en: "Monthly free check for battery and vehicle",
    },
    badge: { th: "พิเศษ", en: "Special" },
    image: "/promo-service.svg",
    published: true,
  },
  {
    id: "promo-2",
    title: { th: "ลดอะไหล่แท้ 15%", en: "15% off spare parts" },
    subtitle: {
      th: "สำหรับนัดหมายซ่อมที่จองล่วงหน้าเท่านั้น",
      en: "For scheduled repair appointments only",
    },
    badge: { th: "ดีลฮอต", en: "Hot deal" },
    image: "/promo-parts.svg",
    published: true,
  },
  {
    id: "promo-3",
    title: { th: "แพ็กเกจดูแลรายปี", en: "Annual care package" },
    subtitle: {
      th: "ดูแลครบวงจร พร้อมบริการฉุกเฉิน",
      en: "Full coverage with emergency support",
    },
    badge: { th: "ใหม่", en: "New" },
    image: "/promo-care.svg",
    published: true,
  },
];
