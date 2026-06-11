import { useEffect, useMemo, useState } from "react";
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { StatusBadge } from "@/components/StatusBadge";
import { TodoItem } from "@/components/TodoItem";
import { AddTodoForm } from "@/components/AddTodoForm";
import {
  ArrowLeftIcon,
  CheckboxIcon,
  ExternalLinkIcon,
  ListBulletIcon,
  DashboardIcon,
} from "@radix-ui/react-icons";

const VIEW_KEY = "todos:view";
type View = "list" | "kanban";

function loadInitialView(): View {
  if (typeof window === "undefined") return "list";
  return window.localStorage.getItem(VIEW_KEY) === "kanban" ? "kanban" : "list";
}

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
  const [view, setView] = useState<View>(loadInitialView);

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Todos</h2>
          <p className="text-sm text-muted-foreground">
            Extra todos and per-customer todos.
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => {
            if (v === "list" || v === "kanban") setView(v);
          }}
          variant="outline"
          size="sm"
          aria-label="View mode"
        >
          <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5">
            <ListBulletIcon />
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban view" className="gap-1.5">
            <DashboardIcon />
            Kanban
          </ToggleGroupItem>
        </ToggleGroup>
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

      {!isLoading && view === "list" && (
        <>
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

          {groups && groups.length > 0 && (
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
        </>
      )}

      {!isLoading && view === "kanban" && (
        <>
          {isEmpty ? (
            <KanbanBoard
              extrasColumn={
                <KanbanColumn
                  title="Extra todos"
                  todos={extras ?? []}
                  pendingExtras={pendingExtras}
                  doneExtras={doneExtras}
                />
              }
              groups={[]}
            />
          ) : (
            <KanbanBoard
              extrasColumn={
                <KanbanColumn
                  title="Extra todos"
                  todos={extras ?? []}
                  pendingExtras={pendingExtras}
                  doneExtras={doneExtras}
                />
              }
              groups={groups ?? []}
            />
          )}
        </>
      )}
    </div>
  );
}

function KanbanBoard({
  extrasColumn,
  groups,
}: {
  extrasColumn: React.ReactNode;
  groups: Group[];
}) {
  return (
    <div className="-mx-4 overflow-x-auto pb-4 sm:-mx-6 lg:-mx-10">
      <div className="flex w-max items-start gap-4 px-4 sm:px-6 lg:px-10">
        {extrasColumn}
        {groups.map(({ customer, todos }) => (
          <KanbanColumn key={customer._id} customer={customer} todos={todos} />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  customer,
  todos,
  pendingExtras,
  doneExtras,
}: {
  title?: string;
  customer?: CustomerSummary;
  todos: Doc<"todos">[];
  pendingExtras?: Doc<"todos">[];
  doneExtras?: Doc<"todos">[];
}) {
  const pending = pendingExtras ?? todos.filter((t) => !t.done);
  const done = doneExtras ?? todos.filter((t) => t.done);
  const isExtras = !customer;

  return (
    <Card className="flex w-80 shrink-0 flex-col bg-muted/30">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="text-base truncate">
              {customer ? customer.name : title}
            </CardTitle>
            {customer && <StatusBadge status={customer.status} />}
          </div>
          {customer && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Open customer"
              className="shrink-0"
            >
              <Link to={`/customers/${customer._id}`}>
                <ExternalLinkIcon />
              </Link>
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {pending.length} pending · {done.length} done
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <AddTodoForm
          customerId={customer?._id}
          placeholder={isExtras ? "Add an extra todo…" : undefined}
        />
        {todos.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            {isExtras ? "No extra todos yet." : "No todos yet."}
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
            {pending.map((t) => (
              <TodoItem key={t._id} todo={t} />
            ))}
            {done.map((t) => (
              <TodoItem key={t._id} todo={t} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
