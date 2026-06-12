import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/DateTimePicker";
import { fromLocalInputValue, toLocalInputValue, tomorrowAt } from "@/lib/due";
import { ClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PostponeTodoDialog({
  todoId,
  text,
  open,
  onOpenChange,
}: {
  todoId: Id<"todos">;
  text: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setDue = useMutation(api.todos.setDue);
  const [due, setDueValue] = useState(() => toLocalInputValue(tomorrowAt(11)));
  const [saving, setSaving] = useState(false);

  // Reset to tomorrow 11:00 AM each time the dialog opens.
  useEffect(() => {
    if (open) setDueValue(toLocalInputValue(tomorrowAt(11)));
  }, [open]);

  async function confirm() {
    setSaving(true);
    try {
      await setDue({ id: todoId, dueAt: fromLocalInputValue(due) });
      onOpenChange(false);
      toast.success("Task postponed");
    } catch (err) {
      toast.error("Could not postpone task");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Postpone task</DialogTitle>
          <DialogDescription>
            “{text}” will be rescheduled. By default it moves to tomorrow
            morning at 11:00 AM — change the date and time below if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">New due date &amp; time</span>
          <DateTimePicker
            value={due}
            onChange={setDueValue}
            className="w-full sm:w-[230px]"
            aria-label="New due date and time"
          />
        </div>
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={saving}>
            {saving ? "Postponing…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostponeTodoButton({
  todoId,
  text,
  label = "Change",
  className,
}: {
  todoId: Id<"todos">;
  text: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Postpone: ${text}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted",
          className,
        )}
      >
        <ClockIcon className="size-3" />
        {label}
      </button>
      <PostponeTodoDialog
        todoId={todoId}
        text={text}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
