import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "sonner";
import { PlusIcon } from "@radix-ui/react-icons";
import { fromLocalInputValue, nowLocalInputValue } from "@/lib/due";

export function AddTodoForm({
  customerId,
  placeholder,
  onAdded,
}: {
  customerId?: Id<"customers">;
  placeholder?: string;
  onAdded?: () => void;
}) {
  const createTodo = useMutation(api.todos.create);
  const [text, setText] = useState("");
  const [due, setDue] = useState<string>(nowLocalInputValue);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const dueAt = due ? fromLocalInputValue(due) : undefined;
      await createTodo({ customerId, text: trimmed, dueAt });
      setText("");
      setDue(nowLocalInputValue());
      onAdded?.();
    } catch (err) {
      toast.error("Could not add todo");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        className="sm:flex-1"
        placeholder={placeholder ?? "Add a todo for this customer…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DateTimePicker
          value={due}
          onChange={setDue}
          aria-label="Due date and time"
        />
        <Button type="submit" disabled={submitting || !text.trim()}>
          <PlusIcon data-icon="inline-start" />
          {submitting ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
