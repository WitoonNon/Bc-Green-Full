import type { RepairRequest } from "@/types/repair";

export const mockRepairs: RepairRequest[] = [
  {
    id: "repair-001",
    trackingCode: "BC-2025-0001",
    title: { th: "ระบบเบรกฝืด", en: "Brake system feels stiff" },
    category: { th: "ระบบเบรก", en: "Brake system" },
    detail:
      "เบรกมีอาการฝืด กดแล้วรู้สึกต้านมากขึ้น และมีเสียงเสียดสี",
    status: "diagnosing",
    preferredDate: "2025-12-25",
    createdAt: "2025-12-20 09:30",
    updatedAt: "2025-12-21 10:15",
    vehicleModel: "KEDAR J50",
    serialNumber: "KD-J50-23987",
    assignedTechnician: "คุณสมชาย",
    attachments: [
      { name: "brake-photo.jpg", url: "/repair-photo.svg", type: "image" },
    ],
    timeline: [
      { status: "received", updatedAt: "2025-12-20 09:30" },
      {
        status: "diagnosing",
        updatedAt: "2025-12-21 10:15",
        note: "กำลังตรวจสอบชุดเบรกและผ้าเบรก",
      },
    ],
  },
];

export const mockHistory: RepairRequest[] = [
  {
    id: "repair-002",
    trackingCode: "BC-2025-0002",
    title: { th: "ชาร์จไม่เข้า", en: "Charging not working" },
    category: { th: "ระบบไฟ", en: "Electrical" },
    detail: "เสียบชาร์จแล้วไม่มีไฟแสดงผล",
    status: "completed",
    preferredDate: "2025-11-15",
    createdAt: "2025-11-12 14:00",
    updatedAt: "2025-11-17 16:40",
    vehicleModel: "KEDAR GT-1",
    serialNumber: "KD-GT1-00231",
    attachments: [],
    timeline: [
      { status: "received", updatedAt: "2025-11-12 14:00" },
      { status: "diagnosing", updatedAt: "2025-11-13 09:00" },
      { status: "repairing", updatedAt: "2025-11-14 13:20" },
      { status: "completed", updatedAt: "2025-11-17 16:40" },
    ],
  },
];
