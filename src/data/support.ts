import type { FaqItem, ManualItem, SupportContact } from "@/types/support";

export const manuals: ManualItem[] = [
  {
    id: "manual-1",
    title: { th: "คู่มือบำรุงรักษาพื้นฐาน", en: "Basic maintenance guide" },
    summary: {
      th: "เช็กลมยาง เบรก และการชาร์จแบตเตอรี่",
      en: "Brake, tire, and battery charging checklist",
    },
    link: "#",
    published: true,
  },
  {
    id: "manual-2",
    title: { th: "การใช้งานระบบชาร์จ", en: "Charging system usage" },
    summary: {
      th: "วิธีชาร์จและดูแลแบตเตอรี่ให้ใช้งานได้นาน",
      en: "How to charge and maintain the battery",
    },
    link: "#",
    published: true,
  },
  {
    id: "manual-3",
    title: { th: "แก้ปัญหาเบื้องต้น", en: "Quick troubleshooting" },
    summary: {
      th: "ทิปตรวจสอบด้วยตัวเองเมื่อเกิดปัญหาทั่วไป",
      en: "Self-check tips for common issues",
    },
    link: "#",
    published: true,
  },
];

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: {
      th: "รถสตาร์ทไม่ติดควรทำอย่างไร?",
      en: "What should I do if the vehicle won't start?",
    },
    answer: {
      th: "ตรวจสอบแบตเตอรี่ รีสตาร์ทระบบ และส่งคำร้องหากปัญหายังอยู่",
      en: "Check battery charge, restart the system, and submit a repair request if the issue persists.",
    },
    tags: ["battery", "start"],
    published: true,
  },
  {
    id: "faq-2",
    question: {
      th: "ได้ยินเสียงผิดปกติขณะขับขี่",
      en: "I hear unusual noises while driving",
    },
    answer: {
      th: "หยุดรถในที่ปลอดภัย บันทึกอาการและส่งรูป/วิดีโอให้ช่าง",
      en: "Stop temporarily, record the issue, and send photo/video to the technician.",
    },
    tags: ["noise", "safety"],
    published: true,
  },
  {
    id: "faq-3",
    question: {
      th: "เปลี่ยนอะไหล่ใช้เวลากี่วัน?",
      en: "How long does spare part replacement take?",
    },
    answer: {
      th: "โดยทั่วไป 3-7 วันทำการ ขึ้นอยู่กับอะไหล่",
      en: "It depends on the part; typically 3-7 business days.",
    },
    tags: ["parts", "timeline"],
    published: true,
  },
];

export const supportContacts: SupportContact[] = [
  {
    id: "phone",
    label: { th: "โทรศัพท์", en: "Phone" },
    value: "062-909-5151",
    href: "tel:0629095151",
  },
  {
    id: "line",
    label: { th: "LINE Official", en: "LINE Official" },
    value: "@bc.ebike",
    href: "https://line.me/R/ti/p/@bc.ebike",
  },
  {
    id: "email",
    label: { th: "อีเมล", en: "Email" },
    value: "contact.bcgreenworld@gmail.com",
    href: "mailto:contact.bcgreenworld@gmail.com",
  },
];
