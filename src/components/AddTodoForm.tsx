import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlusIcon } from "@radix-ui/react-icons";

export function AddTodoForm({
  customerId,
  placeholder,
}: {
  customerId?: Id<"customers">;
  placeholder?: string;
}) {
  const createTodo = useMutation(api.todos.create);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await createTodo({ customerId, text: trimmed });
      setText("");
    } catch (err) {
      toast.error("Could not add todo");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        placeholder={placeholder ?? "Add a todo for this customer…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit" disabled={submitting || !text.trim()}>
        <PlusIcon data-icon="inline-start" />
        {submitting ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
