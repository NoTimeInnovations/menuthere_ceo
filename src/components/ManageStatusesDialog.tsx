import { useState, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import {
  PlusIcon,
  Pencil1Icon,
  CheckIcon,
  Cross2Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#84cc16",
  "#f97316",
  "#6b7280",
  "#0ea5e9",
];

export function ManageStatusesDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const statuses = useQuery(api.statuses.list);
  const createStatus = useMutation(api.statuses.create);
  const removeStatus = useMutation(api.statuses.remove);
  const [editingId, setEditingId] = useState<Id<"statuses"> | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete(id: Id<"statuses">, statusName: string) {
    try {
      await removeStatus({ id });
      toast.success(`Status "${statusName}" deleted`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      const cleaned = message.replace(/^\[CONVEX [^\]]+\]\s*/, "");
      toast.error(cleaned);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await createStatus({ name: trimmed, color });
      toast.success(`Status "${trimmed}" created`);
      setName("");
      setColor(PRESET_COLORS[0]);
    } catch (err) {
      toast.error("Failed to create status");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-6 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage statuses</DialogTitle>
          <DialogDescription>
            Add, rename, recolor or delete your customer statuses.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-2">
          <section className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Existing statuses</h3>
              <span className="text-xs text-muted-foreground">
                {statuses?.length ?? 0} total
              </span>
            </div>
            <div className="-mr-2 flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
              {statuses?.length ? (
                statuses.map((s) =>
                  editingId === s._id ? (
                    <EditStatusRow
                      key={s._id}
                      status={s}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                    >
                      <StatusBadge status={s} />
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(s._id)}
                          aria-label={`Edit ${s.name}`}
                        >
                          <Pencil1Icon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${s.name}`}
                            >
                              <TrashIcon />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete status "{s.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This can't be undone. If any customers still use
                                this status, deletion will be blocked.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(s._id, s.name)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  No statuses yet.
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3 md:border-l md:pl-6">
            <h3 className="text-sm font-semibold">Add new status</h3>
            <form
              onSubmit={handleCreate}
              className="flex flex-1 flex-col justify-between gap-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="status-name">Name</FieldLabel>
                  <Input
                    id="status-name"
                    placeholder="e.g. Follow-up needed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <ColorPicker value={color} onChange={setColor} />
                  <FieldDescription>
                    Pick a color for the badge.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Preview</FieldLabel>
                  <div>
                    <StatusBadge
                      status={{
                        _id: "preview" as unknown as Id<"statuses">,
                        _creationTime: 0,
                        name: name.trim() || "New status",
                        color,
                        order: 0,
                      }}
                    />
                  </div>
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={submitting || !name.trim()}>
                <PlusIcon data-icon="inline-start" />
                {submitting ? "Adding…" : "Add status"}
              </Button>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditStatusRow({
  status,
  onDone,
}: {
  status: Doc<"statuses">;
  onDone: () => void;
}) {
  const updateStatus = useMutation(api.statuses.update);
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === status.name && color === status.color) {
      onDone();
      return;
    }
    setSaving(true);
    try {
      await updateStatus({ id: status._id, name: trimmed, color });
      toast.success("Status updated");
      onDone();
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-3 ring-2 ring-primary/30">
      <div className="flex items-center gap-2">
        <span
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          <Cross2Icon data-icon="inline-start" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          <CheckIcon data-icon="inline-start" />
          Save
        </Button>
      </div>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "size-7 rounded-full border-2 transition-transform hover:scale-110",
            value === c ? "border-foreground" : "border-transparent",
          )}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}
