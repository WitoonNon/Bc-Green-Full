export type NotificationTarget = {
  toRole?: "technician" | "admin" | "user";
  toUserId?: string;
};

export type AppNotification = {
  id: string;
  type: "new-ticket" | "status-update";
  ticketId?: string;
  createdAt: string;
  read: boolean;
  title: string;
  message: string;
  link?: string;
} & NotificationTarget;
