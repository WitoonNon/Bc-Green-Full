import type { AppNotification } from "@/types/notification";

export const mockNotices: AppNotification[] = [
    {
        id: "notice-1",
        type: "new-ticket",
        toRole: "technician",
        title: "มีงานแจ้งซ่อมใหม่",
        message: "ลูกค้าแจ้งปัญหา รหัสงาน BC-202603-7098",
        read: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: "notice-2",
        type: "status-update",
        toRole: "technician",
        title: "อัปเดตระบบ",
        message: "ระบบจะทำการอัปเดตคืนนี้เวลา 24:00 น.",
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
];
