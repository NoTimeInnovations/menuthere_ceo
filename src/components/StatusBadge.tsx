import { Doc } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: Doc<"statuses"> | null | undefined;
  className?: string;
}) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <span className="size-2 rounded-full bg-muted-foreground/40" />
        Unknown
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        borderColor: `${status.color}55`,
        backgroundColor: `${status.color}14`,
        color: status.color,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: status.color }}
      />
      {status.name}
    </span>
  );
}
