import { cn } from "@/lib/utils";
import { trackingStatusMeta } from "@/lib/tracking";

export function TrackingStatusBadge({
  value,
  className,
}: {
  value: string | undefined;
  className?: string;
}) {
  const meta = trackingStatusMeta(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        borderColor: `${meta.color}55`,
        backgroundColor: `${meta.color}14`,
        color: meta.color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
