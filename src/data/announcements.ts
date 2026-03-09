import type { LocalizedText } from "@/types/locale";

export const announcements: Array<{
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  date: string;
}> = [
  {
    id: "announce-1",
    title: { th: "ศูนย์บริการหยุดปีใหม่", en: "New year service break" },
    detail: {
      th: "ปิดทำการ 30 ธ.ค. - 2 ม.ค.",
      en: "Service center closed Dec 30 - Jan 2",
    },
    date: "2025-12-24",
  },
  {
    id: "announce-2",
    title: { th: "เปิดศูนย์ซ่อมด่วนสาขาบางนา", en: "New express repair hub" },
    detail: {
      th: "เปิดทุกวัน 09:00-18:00",
      en: "Bangna branch open daily 09:00-18:00",
    },
    date: "2025-12-20",
  },
];
