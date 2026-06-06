import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Parts = {
  date: string;
  hour12: number;
  minute: number;
  period: "AM" | "PM";
};

function parse(value: string): Parts {
  const [datePart = "", timePart = ""] = value.split("T");
  const [hStr = "0", mStr = "0"] = timePart.split(":");
  const h24 = Number(hStr) || 0;
  const minute = Number(mStr) || 0;
  const period: "AM" | "PM" = h24 < 12 ? "AM" : "PM";
  const hour12 = h24 % 12 || 12;
  return { date: datePart, hour12, minute, period };
}

function compose(parts: Parts): string {
  const h24 =
    parts.period === "AM"
      ? parts.hour12 % 12
      : (parts.hour12 % 12) + 12;
  const hh = String(h24).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${parts.date}T${hh}:${mm}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

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
  const parts = parse(value);

  function update(next: Partial<Parts>) {
    onChange(compose({ ...parts, ...next }));
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      aria-label={ariaLabel}
    >
      <Input
        type="date"
        value={parts.date}
        onChange={(e) => update({ date: e.target.value })}
        className="w-[150px]"
        aria-label="Due date"
      />
      <div className="flex items-center gap-1">
        <Select
          value={String(parts.hour12)}
          onValueChange={(v) => update({ hour12: Number(v) })}
        >
          <SelectTrigger className="w-[68px]" aria-label="Hour">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={String(h)}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          value={String(parts.minute)}
          onValueChange={(v) => update({ minute: Number(v) })}
        >
          <SelectTrigger className="w-[72px]" aria-label="Minute">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {String(m).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={parts.period}
          onValueChange={(v) => update({ period: v as "AM" | "PM" })}
        >
          <SelectTrigger className="w-[72px]" aria-label="AM or PM">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
