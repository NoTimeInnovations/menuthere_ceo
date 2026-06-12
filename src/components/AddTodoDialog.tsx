import { ReactNode, useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTodoForm } from "@/components/AddTodoForm";

export function AddTodoDialog({
  customerId,
  children,
}: {
  customerId: Id<"customers">;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add todo</DialogTitle>
          <DialogDescription>
            Create a todo for this customer with an optional due date and time.
          </DialogDescription>
        </DialogHeader>
        <AddTodoForm customerId={customerId} onAdded={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
