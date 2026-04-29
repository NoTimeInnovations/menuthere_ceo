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
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineItem } from "@/components/TimelineItem";
import { AddRemarkForm } from "@/components/AddRemarkForm";
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import {
  ArrowLeftIcon,
  Pencil1Icon,
  TrashIcon,
  UpdateIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
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
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <CardDescription>{customer.phone}</CardDescription>
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
