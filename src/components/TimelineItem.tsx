import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsHorizontalIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

type Remark = Doc<"remarks"> & {
  status: Doc<"statuses"> | null;
};

export function TimelineItem({ remark }: { remark: Remark }) {
  const updateRemark = useMutation(api.remarks.update);
  const removeRemark = useMutation(api.remarks.remove);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(remark.text);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === remark.text) {
      setEditing(false);
      setDraft(remark.text);
      return;
    }
    setSaving(true);
    try {
      await updateRemark({ id: remark._id, text: trimmed });
      toast.success("Remark updated");
      setEditing(false);
    } catch (err) {
      toast.error("Could not update remark");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await removeRemark({ id: remark._id });
      toast.success("Remark deleted");
    } catch (err) {
      toast.error("Could not delete remark");
      console.error(err);
    }
  }

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className="size-3 rounded-full ring-4 ring-background"
          style={{
            backgroundColor: remark.status?.color ?? "hsl(var(--muted-foreground))",
          }}
        />
        <span className="w-px grow bg-border" />
      </div>
      <div className="flex flex-1 flex-col gap-2 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={remark.status} />
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(remark._creationTime)}
            </span>
          </div>
          {!editing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Remark actions">
                  <DotsHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setEditing(true)}>
                    <Pencil1Icon data-icon="inline-start" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <TrashIcon data-icon="inline-start" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete remark?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the entry from the timeline.
                          This cannot be undone.
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
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
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
                  setDraft(remark.text);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {remark.text}
          </p>
        )}
      </div>
    </li>
  );
}

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
