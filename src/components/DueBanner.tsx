import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  PersonIcon,
  Cross2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { PostponeTodoDialog } from "@/components/PostponeTodoDialog";
import { formatDueTime, formatTimeLeft, isDueToday, isOverdue } from "@/lib/due";
import { useNow } from "@/lib/useNow";

type BannerTodo = {
  _id: string;
  text: string;
  dueAt: number;
  customer: { _id: string; name: string } | null;
};

const COLLAPSE_KEY = "dueBanner:collapsed";

function loadCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

type DueBannerContextValue = {
  items: BannerTodo[];
  now: number;
  collapsed: boolean;
  setCollapsed: (next: boolean | ((prev: boolean) => boolean)) => void;
};

const DueBannerContext = createContext<DueBannerContextValue | null>(null);

export function DueBannerProvider({ children }: { children: ReactNode }) {
  const todos = useQuery(api.todos.listForBanner) as BannerTodo[] | undefined;
  const now = useNow(30000);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const items = useMemo(() => {
    if (!todos) return [];
    return todos
      .filter((t) => isDueToday(t.dueAt, now) || t.dueAt < now)
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [todos, now]);

  return (
    <DueBannerContext.Provider value={{ items, now, collapsed, setCollapsed }}>
      {children}
    </DueBannerContext.Provider>
  );
}

function useDueBanner(): DueBannerContextValue {
  const ctx = useContext(DueBannerContext);
  if (!ctx) {
    throw new Error("useDueBanner must be used within a DueBannerProvider");
  }
  return ctx;
}

// Lives in the always-visible header so tasks can be re-shown after hiding.
export function TasksToggleButton() {
  const { items, collapsed, setCollapsed } = useDueBanner();
  if (items.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => setCollapsed((c) => !c)}
      aria-expanded={!collapsed}
      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
    >
      {collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
      Tasks · {items.length}
    </button>
  );
}

export function DueBanner() {
  const { items, now, collapsed } = useDueBanner();

  if (items.length === 0 || collapsed) return null;

  const overdueCount = items.filter((t) => isOverdue(t.dueAt, false, now)).length;
  const upcomingCount = items.length - overdueCount;

  return (
    <div className="border-b bg-muted/40">
      <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:px-10">
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
  const navigate = useNavigate();
  const overdue = isOverdue(todo.dueAt, false, now);
  const [open, setOpen] = useState(false);

  const href = todo.customer ? `/customers/${todo.customer._id}` : "/todos";

  return (
    <>
      <div
        onClick={() => navigate(href)}
        className={cn(
          "flex w-56 shrink-0 cursor-pointer flex-col gap-1 rounded-md border bg-card px-3 py-2 text-left shadow-sm transition-colors",
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
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1">
            <PersonIcon className="size-3 shrink-0" />
            <span className="truncate">{todo.customer?.name ?? "Extra todo"}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            aria-label="Close task and postpone"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 font-medium hover:bg-muted"
          >
            <Cross2Icon className="size-3" />
            Close
          </button>
        </div>
      </div>

      <PostponeTodoDialog
        todoId={todo._id as Id<"todos">}
        text={todo.text}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
