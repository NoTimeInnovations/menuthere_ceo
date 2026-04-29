import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

export function AddRemarkForm({ customerId }: { customerId: Id<"customers"> }) {
  const createRemark = useMutation(api.remarks.create);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await createRemark({ customerId, text: trimmed });
      setText("");
    } catch (err) {
      toast.error("Could not add remark");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-remark">Add remark</FieldLabel>
          <Textarea
            id="new-remark"
            placeholder="What happened? e.g. Called and confirmed delivery date…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </Field>
      </FieldGroup>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={submitting || !text.trim()}>
          <PaperPlaneIcon data-icon="inline-start" />
          {submitting ? "Adding…" : "Add remark"}
        </Button>
      </div>
    </form>
  );
}
