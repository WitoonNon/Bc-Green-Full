import type { LocalizedText } from "@/types/locale";

export type RepairStatus =
  | "received"
  | "diagnosing"
  | "repairing"
  | "completed"
  | "rejected";

export type RepairAttachmentType = "image" | "video" | "file";

export type RepairAttachment = {
  name: string;
  url: string;
  type: RepairAttachmentType;
};

export type RepairTimelineEntry = {
  status: RepairStatus;
  note?: string;
  updatedAt: string;
};

export type RepairRequest = {
  id: string;
  trackingCode: string;
  title: LocalizedText;
  category: LocalizedText;
  detail: string;
  status: RepairStatus;
  createdBy?: string;
  preferredDate: string;
  createdAt: string;
  updatedAt?: string;
  vehicleModel: string;
  serialNumber?: string;
  assignedTechnician?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachments: RepairAttachment[];
  timeline: RepairTimelineEntry[];
};

export type RepairCreateInput = {
  title: string;
  category: string;
  detail: string;
  preferredDate: string;
  vehicleModel: string;
  serialNumber?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
};
