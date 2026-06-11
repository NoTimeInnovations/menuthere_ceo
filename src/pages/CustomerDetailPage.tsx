import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineItem } from "@/components/TimelineItem";
import { AddRemarkForm } from "@/components/AddRemarkForm";
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import { TrackingCard } from "@/components/TrackingCard";
import { TodosSection } from "@/components/TodosSection";
import { PlanSection } from "@/components/PlanSection";
import {
  ArrowLeftIcon,
  Pencil1Icon,
  TrashIcon,
  UpdateIcon,
  ChatBubbleIcon,
  EnterFullScreenIcon,
  Cross2Icon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { Phone as PhoneIcon } from "lucide-react";
import { toast } from "sonner";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = id as Id<"customers">;

  const customer = useQuery(api.customers.get, { id: customerId });
  const remarks = useQuery(api.remarks.listByCustomer, { customerId });
  const removeCustomer = useMutation(api.customers.remove);

  if (customer === undefined) {
    return <DetailSkeleton />;
  }

  if (customer === null) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Customer not found</EmptyTitle>
          <EmptyDescription>
            This customer may have been deleted.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link to="/">Back to customers</Link>
        </Button>
      </Empty>
    );
  }

  async function handleDelete() {
    try {
      await removeCustomer({ id: customerId });
      toast.success("Customer deleted");
      navigate("/");
    } catch (err) {
      toast.error("Could not delete customer");
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to customers
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      aria-label="Show name and phone fullscreen"
                    >
                      <EnterFullScreenIcon />
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="bg-background" />
                    <DialogPrimitive.Content
                      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background p-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                    >
                      <DialogPrimitive.Title className="text-center text-6xl font-bold tracking-tight sm:text-8xl md:text-9xl break-words max-w-full">
                        {customer.name}
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-center text-5xl font-mono font-semibold tracking-wider sm:text-7xl md:text-8xl break-words max-w-full">
                        {customer.phone}
                      </DialogPrimitive.Description>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          className="absolute right-6 top-6"
                          aria-label="Close"
                        >
                          <Cross2Icon data-icon="inline-start" />
                          Close
                        </Button>
                      </DialogClose>
                    </DialogPrimitive.Content>
                  </DialogPortal>
                </Dialog>
              </div>
              <div className="flex items-center gap-1.5">
                <CardDescription>{customer.phone}</CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label="Copy phone number"
                  onClick={async () => {
                    await navigator.clipboard.writeText(customer.phone);
                    toast.success("Phone number copied");
                  }}
                >
                  <CopyIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label="Call phone number"
                  asChild
                >
                  <a href={`tel:${customer.phone.replace(/\s+/g, "")}`}>
                    <PhoneIcon />
                  </a>
                </Button>
              </div>
              <div className="mt-1">
                <StatusBadge status={customer.status} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ChangeStatusDialog
                customerId={customer._id}
                currentStatusId={customer.statusId}
              >
                <Button variant="outline" size="sm">
                  <UpdateIcon data-icon="inline-start" />
                  Change status
                </Button>
              </ChangeStatusDialog>
              <EditCustomerDialog
                customerId={customer._id}
                initialName={customer.name}
                initialPhone={customer.phone}
              >
                <Button variant="outline" size="sm">
                  <Pencil1Icon data-icon="inline-start" />
                  Edit
                </Button>
              </EditCustomerDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon data-icon="inline-start" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {customer.name} and all
                      timeline remarks. This cannot be undone.
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
          </div>
        </CardHeader>
      </Card>

      <PlanSection customerId={customer._id} plan={customer.plan} />

      <TrackingCard customer={customer} />

      <TodosSection customerId={customer._id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New remark</CardTitle>
        </CardHeader>
        <CardContent>
          <AddRemarkForm customerId={customer._id} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Timeline</h3>
          <span className="text-sm text-muted-foreground">
            {remarks?.length ?? 0}{" "}
            {remarks?.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <Separator />

        {remarks === undefined ? (
          <TimelineSkeleton />
        ) : remarks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChatBubbleIcon />
              </EmptyMedia>
              <EmptyTitle>No remarks yet</EmptyTitle>
              <EmptyDescription>
                Add the first remark above to start the timeline.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col">
            {remarks.map((r) => (
              <TimelineItem key={r._id} remark={r} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="ml-auto h-9 w-28" />
        </CardFooter>
      </Card>
      <TimelineSkeleton />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-3 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
