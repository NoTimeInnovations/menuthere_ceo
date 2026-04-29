import { useState, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageStatusesDialog } from "@/components/ManageStatusesDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function NewCustomerDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const statuses = useQuery(api.statuses.list);
  const createCustomer = useMutation(api.customers.create);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [statusId, setStatusId] = useState<Id<"statuses"> | "">("");
  const [initialRemark, setInitialRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setPhone("");
    setStatusId("");
    setInitialRemark("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !statusId) return;
    setSubmitting(true);
    try {
      const id = await createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        statusId: statusId as Id<"statuses">,
        initialRemark: initialRemark.trim() || undefined,
      });
      toast.success("Customer added");
      reset();
      setOpen(false);
      navigate(`/customers/${id}`);
    } catch (err) {
      toast.error("Failed to add customer");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new customer</DialogTitle>
          <DialogDescription>
            Capture the basics. You can add remarks later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customer-name">Name</FieldLabel>
              <Input
                id="customer-name"
                placeholder="Acme Restaurant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
              <Input
                id="customer-phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-status">Status</FieldLabel>
              <Select
                value={statusId}
                onValueChange={(v) => setStatusId(v as Id<"statuses">)}
              >
                <SelectTrigger id="customer-status">
                  <SelectValue placeholder="Pick a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statuses?.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Need a new status?{" "}
                <ManageStatusesDialog>
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    Manage statuses
                  </button>
                </ManageStatusesDialog>
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-remark">
                Initial remark (optional)
              </FieldLabel>
              <Textarea
                id="customer-remark"
                placeholder="Any first note about this customer…"
                value={initialRemark}
                onChange={(e) => setInitialRemark(e.target.value)}
                rows={3}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !phone.trim() || !statusId}
            >
              {submitting ? "Adding…" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
