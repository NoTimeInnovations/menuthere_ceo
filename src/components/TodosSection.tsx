import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTodoForm } from "@/components/AddTodoForm";
import { TodoItem } from "@/components/TodoItem";

export function TodosSection({
  customerId,
}: {
  customerId: Id<"customers">;
}) {
  const todos = useQuery(api.todos.listByCustomer, { customerId });

  const pending = todos?.filter((t) => !t.done) ?? [];
  const done = todos?.filter((t) => t.done) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Todos</CardTitle>
          {todos && (
            <span className="text-xs text-muted-foreground">
              {pending.length} pending · {done.length} done
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddTodoForm customerId={customerId} />

        {todos === undefined ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No todos yet. Add one above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
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
