export type TrackingKey =
  | "playStore"
  | "appStore"
  | "cashfree"
  | "posIntegration";

export type TrackingStatus =
  | "not_started"
  | "not_needed"
  | "pending"
  | "review"
  | "error"
  | "done";

export const TRACKING_ITEMS: { key: TrackingKey; label: string }[] = [
  { key: "playStore", label: "Play Store" },
  { key: "appStore", label: "App Store" },
  { key: "cashfree", label: "Cashfree" },
  { key: "posIntegration", label: "POS Integration" },
];

export const TRACKING_STATUSES: {
  value: TrackingStatus;
  label: string;
  color: string;
}[] = [
  { value: "not_started", label: "Not started", color: "#94a3b8" },
  { value: "not_needed", label: "Not needed", color: "#64748b" },
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "review", label: "Review", color: "#3b82f6" },
  { value: "error", label: "Error", color: "#ef4444" },
  { value: "done", label: "Done", color: "#10b981" },
];

const STATUS_MAP = new Map(TRACKING_STATUSES.map((s) => [s.value, s]));

export function trackingStatusMeta(value: string | undefined) {
  return STATUS_MAP.get((value ?? "not_started") as TrackingStatus) ?? STATUS_MAP.get("not_started")!;
}
