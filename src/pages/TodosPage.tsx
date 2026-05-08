import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { StatusBadge } from "@/components/StatusBadge";
import { TodoItem } from "@/components/TodoItem";
import { AddTodoForm } from "@/components/AddTodoForm";
import {
  ArrowLeftIcon,
  CheckboxIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";

type CustomerSummary = {
  _id: Id<"customers">;
  name: string;
  phone: string;
  status: Doc<"statuses"> | null;
};

type Group = {
  customer: CustomerSummary;
  todos: Doc<"todos">[];
};

export function TodosPage() {
  const all = useQuery(api.todos.listAll);
  const extras = useQuery(api.todos.listExtras);

  const groups = useMemo<Group[] | null>(() => {
    if (!all) return null;
    const map = new Map<string, Group>();
    for (const t of all) {
      if (!t.customer) continue;
      const key = t.customer._id;
      let group = map.get(key);
      if (!group) {
        group = { customer: t.customer, todos: [] };
        map.set(key, group);
      }
      const { customer: _omit, ...rest } = t;
      group.todos.push(rest as Doc<"todos">);
    }
    return [...map.values()].sort((a, b) =>
      a.customer.name.localeCompare(b.customer.name),
    );
  }, [all]);

  const isLoading = all === undefined || extras === undefined;
  const noCustomerTodos = !isLoading && (groups?.length ?? 0) === 0;
  const noExtras = !isLoading && (extras?.length ?? 0) === 0;
  const isEmpty = noCustomerTodos && noExtras;

  const pendingExtras = extras?.filter((t) => !t.done) ?? [];
  const doneExtras = extras?.filter((t) => t.done) ?? [];

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

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Todos</h2>
        <p className="text-sm text-muted-foreground">
          Extra todos and per-customer todos.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Extra todos</CardTitle>
              <span className="text-xs text-muted-foreground">
                {pendingExtras.length} pending · {doneExtras.length} done
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AddTodoForm placeholder="Add an extra todo…" />
            {extras && extras.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {pendingExtras.map((t) => (
                  <TodoItem key={t._id} todo={t} />
                ))}
                {doneExtras.map((t) => (
                  <TodoItem key={t._id} todo={t} />
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No extra todos yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckboxIcon />
            </EmptyMedia>
            <EmptyTitle>No customer todos yet</EmptyTitle>
            <EmptyDescription>
              Open a customer and add a todo to see it here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && groups && groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map(({ customer, todos }) => {
            const pending = todos.filter((t) => !t.done);
            const done = todos.filter((t) => t.done);
            return (
              <Card key={customer._id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {customer.name}
                      </CardTitle>
                      <StatusBadge status={customer.status} />
                      <span className="text-xs text-muted-foreground">
                        {pending.length} pending · {done.length} done
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/customers/${customer._id}`}>
                        Open
                        <ExternalLinkIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <AddTodoForm customerId={customer._id} />
                  <ul className="flex flex-col gap-2">
                    {pending.map((t) => (
                      <TodoItem key={t._id} todo={t} />
                    ))}
                    {done.map((t) => (
                      <TodoItem key={t._id} todo={t} />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
