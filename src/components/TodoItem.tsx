import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TodoItem({ todo }: { todo: Doc<"todos"> }) {
  const toggleTodo = useMutation(api.todos.toggle);
  const updateTodo = useMutation(api.todos.update);
  const removeTodo = useMutation(api.todos.remove);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [saving, setSaving] = useState(false);

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
    if (!trimmed || trimmed === todo.text) {
      setEditing(false);
      setDraft(todo.text);
      return;
    }
    setSaving(true);
    try {
      await updateTodo({ id: todo._id, text: trimmed });
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
    <li className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
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
        <div className="flex flex-1 items-center gap-2">
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
      ) : (
        <>
          <span
            className={cn(
              "flex-1 text-sm leading-snug whitespace-pre-wrap break-words",
              todo.done && "text-muted-foreground line-through",
            )}
          >
            {todo.text}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit todo"
              onClick={() => setEditing(true)}
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
    </li>
  );
}
