import { ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PriorityCustomer = {
  _id: Id<"customers">;
  name: string;
  phone: string;
  priority?: number;
  status: Doc<"statuses"> | null;
};

function SortableRow({
  c,
  index,
}: {
  c: PriorityCustomer;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card p-3 shadow-sm",
        isDragging && "opacity-60 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag ${c.name}`}
      >
        <DragHandleDots2Icon className="size-5" />
      </button>
      <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{c.name}</div>
        <div className="truncate text-sm text-muted-foreground">{c.phone}</div>
      </div>
      <StatusBadge status={c.status} className="shrink-0" />
    </div>
  );
}

export function PriorityDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PriorityCustomer[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const data = useQuery(
    api.customers.listForPriority,
    open ? {} : "skip",
  );
  const ensurePriorities = useMutation(api.customers.ensurePriorities);
  const reorder = useMutation(api.customers.reorder);

  useEffect(() => {
    if (!open) return;
    ensurePriorities({}).catch((err) => {
      console.error(err);
    });
  }, [open, ensurePriorities]);

  useEffect(() => {
    if (!data || dirty) return;
    setItems(data);
  }, [data, dirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((cur) => {
      const oldIndex = cur.findIndex((c) => c._id === active.id);
      const newIndex = cur.findIndex((c) => c._id === over.id);
      if (oldIndex < 0 || newIndex < 0) return cur;
      return arrayMove(cur, oldIndex, newIndex);
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await reorder({ ids: items.map((c) => c._id) });
      toast.success("Priority saved");
      setDirty(false);
      setOpen(false);
    } catch (err) {
      toast.error("Could not save priority");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function resetAndClose() {
    if (data) setItems(data);
    setDirty(false);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (data) setItems(data);
      setDirty(false);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="left-0 top-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none">
        <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold tracking-tight">
              Customer priority
            </h2>
            <p className="text-sm text-muted-foreground">
              Drag to reorder. Top of the list is highest priority.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={resetAndClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save priority"}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {data === undefined &&
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] w-full rounded-md" />
              ))}
            {data && items.length === 0 && (
              <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
                No customers yet.
              </div>
            )}
            {data && items.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((c) => c._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((c, i) => (
                    <SortableRow key={c._id} c={c} index={i} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}
