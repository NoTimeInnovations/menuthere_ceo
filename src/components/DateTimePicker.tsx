import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DateTimePicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-[230px]", className)}
      aria-label={ariaLabel}
    />
  );
}
