import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
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
import { TrashIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DeleteTodoButton({
  todoId,
  className,
}: {
  todoId: Id<"todos">;
  className?: string;
}) {
  const removeTodo = useMutation(api.todos.remove);

  async function handleDelete() {
    try {
      await removeTodo({ id: todoId });
      toast.success("Todo deleted");
    } catch (err) {
      toast.error("Could not delete todo");
      console.error(err);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Delete todo"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-medium text-destructive hover:bg-destructive/10",
            className,
          )}
        >
          <TrashIcon className="size-3" />
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete todo?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the todo. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
