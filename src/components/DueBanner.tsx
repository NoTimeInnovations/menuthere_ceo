import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  formatDueTime,
  formatTimeLeft,
  isDueToday,
  isOverdue,
} from "@/lib/due";
import { useNow } from "@/lib/useNow";

type BannerTodo = {
  _id: string;
  text: string;
  dueAt: number;
  customer: { _id: string; name: string } | null;
};

export function DueBanner() {
  const todos = useQuery(api.todos.listForBanner) as BannerTodo[] | undefined;
  const now = useNow(30000);

  const items = useMemo(() => {
    if (!todos) return [];
    return todos
      .filter((t) => isDueToday(t.dueAt, now) || t.dueAt < now)
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [todos, now]);

  if (!todos || items.length === 0) return null;

  const overdueCount = items.filter((t) => isOverdue(t.dueAt, false, now)).length;
  const upcomingCount = items.length - overdueCount;

  return (
    <div className="border-b bg-muted/40">
      <div className="flex flex-col gap-2 px-6 py-3 lg:px-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-foreground">
            Tasks · {items.length}
          </span>
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
              <ExclamationTriangleIcon />
              {overdueCount} overdue
            </span>
          )}
          {upcomingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <ClockIcon />
              {upcomingCount} pending
            </span>
          )}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {items.map((t) => (
            <BannerCard key={t._id} todo={t} now={now} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BannerCard({ todo, now }: { todo: BannerTodo; now: number }) {
  const overdue = isOverdue(todo.dueAt, false, now);
  const card = (
    <div
      className={cn(
        "flex w-56 shrink-0 flex-col gap-1 rounded-md border bg-card px-3 py-2 text-left shadow-sm transition-colors",
        overdue
          ? "border-l-4 border-l-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
          : "border-l-4 border-l-amber-500 hover:bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
            overdue
              ? "bg-destructive/15 text-destructive"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          <ClockIcon className="size-3" />
          {formatDueTime(todo.dueAt, now)}
        </span>
        <span
          className={cn(
            "tabular-nums",
            overdue ? "text-destructive font-medium" : "text-muted-foreground",
          )}
        >
          {formatTimeLeft(todo.dueAt, now)}
        </span>
      </div>
      <p
        className={cn(
          "line-clamp-2 text-sm leading-snug",
          overdue && "text-destructive font-medium",
        )}
      >
        {todo.text}
      </p>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <PersonIcon className="size-3" />
        <span className="truncate">{todo.customer?.name ?? "Extra todo"}</span>
      </div>
    </div>
  );

  if (todo.customer) {
    return (
      <Link to={`/customers/${todo.customer._id}`} className="shrink-0">
        {card}
      </Link>
    );
  }
  return (
    <Link to="/todos" className="shrink-0">
      {card}
    </Link>
  );
}
