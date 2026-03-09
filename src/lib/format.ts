export function formatDateTime(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const iso = date.toISOString();
  return iso.replace("T", " ").replace(/\.\d{3}Z$/, "");
}
