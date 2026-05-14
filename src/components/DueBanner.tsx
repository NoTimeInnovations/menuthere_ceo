import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  formatDueTime,
  formatTimeLeft,
  getDueBucket,
  type DueBucket,
} from "@/lib/due";
import { useNow } from "@/lib/useNow";

type BannerTodo = {
  _id: string;
  text: string;
  dueAt: number;
  customer: { _id: string; name: string } | null;
};

const BUCKETS: { id: DueBucket; label: string; tone: string; icon: React.ReactNode }[] = [
  {
    id: "overdue",
    label: "Overdue",
    tone: "text-destructive",
    icon: <ExclamationTriangleIcon />,
  },
  {
    id: "today",
    label: "Today",
    tone: "text-amber-600 dark:text-amber-400",
    icon: <ClockIcon />,
  },
  {
    id: "upcoming",
    label: "Upcoming",
    tone: "text-muted-foreground",
    icon: <CalendarIcon />,
  },
];

export function DueBanner() {
  const todos = useQuery(api.todos.listForBanner) as BannerTodo[] | undefined;
  const now = useNow(30000);

  const grouped = useMemo(() => {
    const out: Record<DueBucket, BannerTodo[]> = {
      overdue: [],
      today: [],
      upcoming: [],
    };
    if (!todos) return out;
    for (const t of todos) {
      out[getDueBucket(t.dueAt, now)].push(t);
    }
    out.overdue.sort((a, b) => a.dueAt - b.dueAt);
    out.today.sort((a, b) => a.dueAt - b.dueAt);
    out.upcoming.sort((a, b) => a.dueAt - b.dueAt);
    return out;
  }, [todos, now]);

  const total = grouped.overdue.length + grouped.today.length + grouped.upcoming.length;
  if (!todos || total === 0) return null;

  return (
    <div className="border-b bg-muted/40">
      <div className="flex flex-col gap-2 px-6 py-3 lg:px-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {BUCKETS.map((b) =>
            grouped[b.id].length > 0 ? (
              <span
                key={b.id}
                className={cn("inline-flex items-center gap-1.5 font-medium", b.tone)}
              >
                {b.icon}
                {grouped[b.id].length} {b.label.toLowerCase()}
              </span>
            ) : null,
          )}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {BUCKETS.flatMap((b) =>
            grouped[b.id].map((t) => (
              <BannerCard key={t._id} todo={t} bucket={b.id} now={now} />
            )),
          )}
        </div>
      </div>
    </div>
  );
}

function BannerCard({
  todo,
  bucket,
  now,
}: {
  todo: BannerTodo;
  bucket: DueBucket;
  now: number;
}) {
  const card = (
    <div
      className={cn(
        "flex w-56 shrink-0 flex-col gap-1 rounded-md border bg-card px-3 py-2 text-left shadow-sm transition-colors",
        bucket === "overdue" &&
          "border-l-4 border-l-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
        bucket === "today" &&
          "border-l-4 border-l-amber-500 hover:bg-muted/60",
        bucket === "upcoming" && "border-l-4 border-l-muted-foreground/30 hover:bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
            bucket === "overdue" && "bg-destructive/15 text-destructive",
            bucket === "today" &&
              "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            bucket === "upcoming" && "bg-muted text-muted-foreground",
          )}
        >
          <ClockIcon className="size-3" />
          {formatDueTime(todo.dueAt, now)}
        </span>
        <span
          className={cn(
            "tabular-nums",
            bucket === "overdue"
              ? "text-destructive font-medium"
              : "text-muted-foreground",
          )}
        >
          {formatTimeLeft(todo.dueAt, now)}
        </span>
      </div>
      <p
        className={cn(
          "line-clamp-2 text-sm leading-snug",
          bucket === "overdue" && "text-destructive font-medium",
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
