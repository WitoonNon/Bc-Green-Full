export type TicketStatus =
  | "NEW"
  | "CHECKING"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type TicketAttachment = {
  url: string;
  path: string;
  type: string;
  name: string;
};

export type TicketTimelineEntry = {
  status: TicketStatus;
  at: string;
  by?: string;
  note?: string;
};

export type Ticket = {
  id: string;
  readableNo: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  vehicleId?: string;
  repairDate?: string;
  attachments: TicketAttachment[];
  status: TicketStatus;
  assignedTo?: string | null;
  timeline: TicketTimelineEntry[];
  createdAt: string;
  updatedAt: string;
};

export type TicketCreateInput = {
  title: string;
  category: string;
  description: string;
  vehicleId?: string;
  repairDate?: string;
};
