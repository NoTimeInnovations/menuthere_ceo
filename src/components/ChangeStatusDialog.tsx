import { useState, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function ChangeStatusDialog({
  customerId,
  currentStatusId,
  children,
}: {
  customerId: Id<"customers">;
  currentStatusId: Id<"statuses">;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const statuses = useQuery(api.statuses.list);
  const changeStatus = useMutation(api.customers.changeStatus);

  const [statusId, setStatusId] = useState<Id<"statuses"> | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!statusId) return;
    setSaving(true);
    try {
      await changeStatus({
        id: customerId,
        statusId: statusId as Id<"statuses">,
        note: note.trim() || undefined,
      });
      toast.success("Status updated");
      setStatusId("");
      setNote("");
      setOpen(false);
    } catch (err) {
      toast.error("Could not change status");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const filtered = statuses?.filter((s) => s._id !== currentStatusId) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            A timeline entry will be created automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-status">New status</FieldLabel>
              <Select
                value={statusId}
                onValueChange={(v) => setStatusId(v as Id<"statuses">)}
              >
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Pick a new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filtered.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="status-note">Note (optional)</FieldLabel>
              <Textarea
                id="status-note"
                placeholder="Why are you changing the status?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !statusId}>
              {saving ? "Saving…" : "Update status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
