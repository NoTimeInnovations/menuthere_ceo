export type DueBucket = "overdue" | "today" | "upcoming";

export function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export function fromLocalInputValue(value: string): number {
  return new Date(value).getTime();
}

export function nowLocalInputValue(): string {
  return toLocalInputValue(Date.now());
}

function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDueBucket(dueAt: number, now = Date.now()): DueBucket {
  if (dueAt < now) return "overdue";
  if (dueAt <= endOfDay(now)) return "today";
  return "upcoming";
}

export function formatDueTime(dueAt: number, now = Date.now()): string {
  const d = new Date(dueAt);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isSameDay(d, new Date(now))) return time;
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${date}, ${time}`;
}

export function formatTimeLeft(dueAt: number, now = Date.now()): string {
  const diff = dueAt - now;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return diff >= 0 ? "now" : "just now";
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days && mins) parts.push(`${mins}m`);
  const phrase = parts.join(" ") || `${minutes}m`;
  return diff < 0 ? `${phrase} overdue` : `in ${phrase}`;
}

export function isOverdue(dueAt: number | undefined, done: boolean, now = Date.now()): boolean {
  return !done && dueAt !== undefined && dueAt < now;
}

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isDueToday(dueAt: number, now = Date.now()): boolean {
  return dueAt >= startOfDay(now) && dueAt <= endOfDay(now);
}
