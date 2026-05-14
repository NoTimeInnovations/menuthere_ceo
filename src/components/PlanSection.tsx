import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil1Icon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export function PlanSection({
  customerId,
  plan,
}: {
  customerId: Id<"customers">;
  plan?: string;
}) {
  const setPlan = useMutation(api.customers.setPlan);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan ?? "");
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setDraft(plan ?? "");
    setEditing(true);
  }

  function cancel() {
    setDraft(plan ?? "");
    setEditing(false);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed === (plan ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await setPlan({ id: customerId, plan: trimmed });
      setEditing(false);
    } catch (err) {
      toast.error("Could not save plan");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Plan</CardTitle>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              aria-label="Edit plan"
            >
              <Pencil1Icon data-icon="inline-start" />
              {plan ? "Edit" : "Add plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Pro, Starter, custom plan details…"
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancel}
                disabled={saving}
              >
                <Cross2Icon data-icon="inline-start" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <CheckIcon data-icon="inline-start" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : plan ? (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {plan}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No plan set. Click “Add plan” to set one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
