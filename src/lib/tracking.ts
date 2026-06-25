export type TrackingKey =
  | "playStore"
  | "appStore"
  | "cashfree"
  | "posIntegration"
  | "whatsapp";

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
  { key: "whatsapp", label: "WhatsApp" },
];

// Columns for the /customers table view, with the CEO-facing labels and the
// underlying stored tracking field each one maps to.
export const CUSTOMER_TABLE_COLUMNS: { key: TrackingKey; label: string }[] = [
  { key: "posIntegration", label: "Petpooja" },
  { key: "cashfree", label: "PG" },
  { key: "playStore", label: "App creation" },
  { key: "whatsapp", label: "WhatsApp" },
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

// WhatsApp uses its own wording: "Setup pending" / "Business verify" instead of
// the generic "Pending" / "Review".
export function trackingStatusLabel(key: TrackingKey, value: string | undefined) {
  const meta = trackingStatusMeta(value);
  if (key === "whatsapp") {
    if (meta.value === "pending") return "Setup pending";
    if (meta.value === "review") return "Business verify";
  }
  return meta.label;
}
