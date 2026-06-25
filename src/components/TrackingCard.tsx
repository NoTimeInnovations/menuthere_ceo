import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TRACKING_ITEMS,
  TRACKING_STATUSES,
  TrackingKey,
  TrackingStatus,
  trackingStatusLabel,
} from "@/lib/tracking";
import { toast } from "sonner";

export function TrackingCard({ customer }: { customer: Doc<"customers"> }) {
  const setTracking = useMutation(api.customers.setTracking);

  async function handleChange(key: TrackingKey, value: TrackingStatus) {
    try {
      await setTracking({
        id: customer._id as Id<"customers">,
        key,
        value,
      });
    } catch (err) {
      toast.error("Could not update tracking");
      console.error(err);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
          {TRACKING_ITEMS.map(({ key, label }) => {
            const current = (customer[key] as string | undefined) ?? "not_started";
            return (
              <Field key={key}>
                <FieldLabel htmlFor={`tracking-${key}`}>{label}</FieldLabel>
                <Select
                  value={current}
                  onValueChange={(v) => handleChange(key, v as TrackingStatus)}
                >
                  <SelectTrigger id={`tracking-${key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TRACKING_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {trackingStatusLabel(key, s.value)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            );
          })}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
