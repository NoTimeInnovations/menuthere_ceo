import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/DateTimePicker";
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
import {
  CheckIcon,
  CircleIcon,
  Pencil1Icon,
  TrashIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  formatDueTime,
  formatTimeLeft,
  fromLocalInputValue,
  isOverdue,
  nowLocalInputValue,
  toLocalInputValue,
} from "@/lib/due";
import { useNow } from "@/lib/useNow";

export function TodoItem({ todo }: { todo: Doc<"todos"> }) {
  const toggleTodo = useMutation(api.todos.toggle);
  const updateTodo = useMutation(api.todos.update);
  const removeTodo = useMutation(api.todos.remove);

  const now = useNow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [dueDraft, setDueDraft] = useState<string>(
    todo.dueAt !== undefined ? toLocalInputValue(todo.dueAt) : nowLocalInputValue(),
  );
  const [saving, setSaving] = useState(false);

  const overdue = isOverdue(todo.dueAt, todo.done, now);

  function startEditing() {
    setDraft(todo.text);
    setDueDraft(
      todo.dueAt !== undefined ? toLocalInputValue(todo.dueAt) : nowLocalInputValue(),
    );
    setEditing(true);
  }

  async function handleToggle() {
    try {
      await toggleTodo({ id: todo._id, done: !todo.done });
    } catch (err) {
      toast.error("Could not update todo");
      console.error(err);
    }
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setEditing(false);
      setDraft(todo.text);
      return;
    }
    const newDueAt = dueDraft ? fromLocalInputValue(dueDraft) : undefined;
    if (trimmed === todo.text && newDueAt === todo.dueAt) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateTodo({ id: todo._id, text: trimmed, dueAt: newDueAt });
      setEditing(false);
    } catch (err) {
      toast.error("Could not update todo");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await removeTodo({ id: todo._id });
      toast.success("Todo deleted");
    } catch (err) {
      toast.error("Could not delete todo");
      console.error(err);
    }
  }

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-md border bg-card px-3 py-2",
        overdue && "border-destructive/50 bg-destructive/5",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={todo.done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            todo.done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 text-transparent hover:border-primary",
          )}
        >
          {todo.done ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CircleIcon className="size-3.5" />
          )}
        </button>

        {editing ? (
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSave();
                } else if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(todo.text);
                }
              }}
            />
            <DateTimePicker
              value={dueDraft}
              onChange={setDueDraft}
              aria-label="Due date and time"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(todo.text);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span
              className={cn(
                "flex-1 text-sm leading-snug whitespace-pre-wrap break-words",
                todo.done && "text-muted-foreground line-through",
                overdue && "text-destructive underline decoration-destructive",
              )}
            >
              {todo.text}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit todo"
                onClick={startEditing}
              >
                <Pencil1Icon />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete todo"
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete todo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the todo. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>

      {!editing && todo.dueAt !== undefined && (
        <div className="flex items-center gap-2 pl-8 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
              overdue
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted text-muted-foreground",
              todo.done && "opacity-60",
            )}
          >
            <ClockIcon className="size-3" />
            {formatDueTime(todo.dueAt, now)}
          </span>
          {!todo.done && (
            <span
              className={cn(
                "text-xs",
                overdue ? "text-destructive font-medium" : "text-muted-foreground",
              )}
            >
              {formatTimeLeft(todo.dueAt, now)}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
