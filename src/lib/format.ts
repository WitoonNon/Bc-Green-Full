export function formatDateTime(value: string | number | Date) {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (value && typeof value === 'object' && 'seconds' in (value as any)) {
    // Handle Firebase Timestamp
    const ts = value as { seconds: number; nanoseconds: number };
    date = new Date(ts.seconds * 1000);
  } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(value as string | number);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(value: string | number | Date) {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (value && typeof value === 'object' && 'seconds' in (value as any)) {
    // Handle Firebase Timestamp
    const ts = value as { seconds: number; nanoseconds: number };
    date = new Date(ts.seconds * 1000);
  } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(value as string | number);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
