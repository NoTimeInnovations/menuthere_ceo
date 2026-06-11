import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { PhoneActions } from "@/components/PhoneActions";
import { TrackingStatusBadge } from "@/components/TrackingStatusBadge";
import { TRACKING_ITEMS } from "@/lib/tracking";
import { NewCustomerDialog } from "@/components/NewCustomerDialog";
import { ManageStatusesDialog } from "@/components/ManageStatusesDialog";
import { PriorityDialog } from "@/components/PriorityDialog";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Cross2Icon,
  PersonIcon,
  MixerHorizontalIcon,
  CaretDownIcon,
  DragHandleDots2Icon,
  CheckboxIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDueTime, formatTimeLeft, isOverdue } from "@/lib/due";
import { useNow } from "@/lib/useNow";

const STATUS_FILTER_KEY = "customers:statusFilters";
const SCROLL_KEY = "customers:scrollY";

function loadInitialStatusFilters(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STATUS_FILTER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function loadSavedScrollY(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SCROLL_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function CustomersPage() {
  const navigate = useNavigate();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>(loadInitialStatusFilters);

  useEffect(() => {
    window.localStorage.setItem(STATUS_FILTER_KEY, JSON.stringify(statusFilters));
  }, [statusFilters]);

  const statuses = useQuery(api.statuses.list);
  const statusCounts = useQuery(api.statuses.withCounts);
  useEffect(() => {
    if (!statuses || statusFilters.length === 0) return;
    const known = new Set(statuses.map((s) => s._id));
    const pruned = statusFilters.filter((id) => known.has(id as Id<"statuses">));
    if (pruned.length !== statusFilters.length) {
      setStatusFilters(pruned);
    }
  }, [statuses, statusFilters]);

  const customers = useQuery(api.customers.list, {
    search: search || undefined,
    statusIds:
      statusFilters.length > 0
        ? (statusFilters as Id<"statuses">[])
        : undefined,
  });

  const isLoading = customers === undefined;
  const isEmpty = customers !== undefined && customers.length === 0;
  const filterActive = search.trim().length > 0 || statusFilters.length > 0;

  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (customers === undefined) return;
    const saved = loadSavedScrollY();
    if (saved == null || saved === 0) {
      scrollRestoredRef.current = true;
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: saved, behavior: "auto" });
      scrollRestoredRef.current = true;
    });
    return () => window.cancelAnimationFrame(id);
  }, [customers]);

  useEffect(() => {
    let frame = 0;
    const handler = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!scrollRestoredRef.current) return;
        window.localStorage.setItem(SCROLL_KEY, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function toggleStatus(id: string) {
    setStatusFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setSearch("");
    setStatusFilters([]);
  }

  const filterLabel = (() => {
    if (statusFilters.length === 0) return "All statuses";
    if (statusFilters.length === 1) {
      const s = statuses?.find((x) => x._id === statusFilters[0]);
      return s?.name ?? "1 status";
    }
    return `${statusFilters.length} statuses`;
  })();

  type CustomerRow = NonNullable<typeof customers>[number];

  function trackingRows(c: CustomerRow) {
    return TRACKING_ITEMS.map(({ key, label }) => (
      <div
        key={key}
        className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap"
      >
        <span>{label}:</span>
        <TrackingStatusBadge value={c[key]} />
      </div>
    ));
  }

  function todoList(c: CustomerRow) {
    if (c.todos.length === 0) {
      return (
        <span className="text-sm italic text-muted-foreground">No todos</span>
      );
    }
    return (
      <ul className="flex flex-col gap-1">
        {c.todos.map((t) => {
          const overdue = isOverdue(t.dueAt, t.done, now);
          return (
            <li
              key={t._id}
              className="flex flex-col gap-0.5 text-sm leading-snug"
            >
              <div className="flex gap-2">
                <span aria-hidden>•</span>
                <span
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    t.done && "text-muted-foreground line-through",
                    !t.done && !overdue && "font-medium text-foreground",
                    overdue &&
                      "font-medium text-destructive underline decoration-destructive",
                  )}
                >
                  {t.text}
                </span>
              </div>
              {t.dueAt !== undefined && (
                <div className="flex flex-wrap items-center gap-1.5 pl-4 text-[11px]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5",
                      overdue
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground",
                      t.done && "opacity-60",
                    )}
                  >
                    <ClockIcon className="size-3" />
                    {formatDueTime(t.dueAt, now)}
                  </span>
                  {!t.done && (
                    <span
                      className={cn(
                        "tabular-nums",
                        overdue
                          ? "text-destructive font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTimeLeft(t.dueAt, now)}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const emptyBlock = (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PersonIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filterActive ? "No matches" : "No customers yet"}
        </EmptyTitle>
        <EmptyDescription>
          {filterActive
            ? "Try a different search term or clear filters."
            : "Add your first customer to start tracking remarks and status."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filterActive ? (
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : (
          <NewCustomerDialog>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add customer
            </Button>
          </NewCustomerDialog>
        )}
      </EmptyContent>
    </Empty>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">
            Track every customer, status and remark in one place.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/todos">
            <CheckboxIcon data-icon="inline-start" />
            Todos
          </Link>
        </Button>
      </div>

      {statusCounts && statusCounts.some((s) => !s.hiddenInSummary) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {statusCounts
            .filter((s) => !s.hiddenInSummary)
            .map((s) => {
              const active = statusFilters.includes(s._id);
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => toggleStatus(s._id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                    active && "ring-2 ring-primary",
                  )}
                  style={{ borderLeftColor: s.color, borderLeftWidth: 4 }}
                  aria-pressed={active}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate text-sm font-medium">
                      {s.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">
                    {s.count}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <InputGroup>
              <InputGroupAddon>
                <MagnifyingGlassIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              />
              {search && (
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    aria-label="Clear search"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Cross2Icon />
                  </button>
                </InputGroupAddon>
              )}
            </InputGroup>
            {searchOpen && search.trim() && customers && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                {customers.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                    No customers found
                  </p>
                ) : (
                  customers.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/customers/${c._id}`);
                      }}
                      className="flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.phone}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="sm:w-56 justify-between font-normal"
              >
                <span className="truncate">{filterLabel}</span>
                <CaretDownIcon className="ml-2 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statuses?.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s._id}
                  checked={statusFilters.includes(s._id)}
                  onCheckedChange={() => toggleStatus(s._id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={() => setStatusFilters([])}
                    className="w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm"
                  >
                    Clear selection
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {filterActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PriorityDialog>
            <Button variant="outline">
              <DragHandleDots2Icon data-icon="inline-start" />
              Priority
            </Button>
          </PriorityDialog>
          <ManageStatusesDialog>
            <Button variant="outline">
              <MixerHorizontalIcon data-icon="inline-start" />
              Statuses
            </Button>
          </ManageStatusesDialog>
          <NewCustomerDialog>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add customer
            </Button>
          </NewCustomerDialog>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-48" />
            </div>
          ))}

        {!isLoading &&
          customers?.map((c) => (
            <div
              key={c._id}
              onClick={() => navigate(`/customers/${c._id}`)}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 active:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">{c.name}</span>
                  {c.plan && (
                    <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {c.plan}
                    </span>
                  )}
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">{c.phone}</span>
                <PhoneActions phone={c.phone} />
              </div>

              <div className="flex flex-col gap-1">{trackingRows(c)}</div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Latest remark
                </span>
                {c.latestRemark ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {c.latestRemark.text}
                  </p>
                ) : (
                  <span className="text-sm italic text-muted-foreground">
                    No remarks yet
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Todos
                </span>
                {todoList(c)}
              </div>
            </div>
          ))}

        {isEmpty && (
          <div className="rounded-lg border bg-card">{emptyBlock}</div>
        )}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden rounded-md border bg-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="w-[170px]">Phone</TableHead>
                <TableHead className="w-[260px]">Status</TableHead>
                <TableHead>Latest remark</TableHead>
                <TableHead className="w-[320px]">Todos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading &&
                customers?.map((c) => (
                  <TableRow
                    key={c._id}
                    className="cursor-pointer hover:bg-muted/50 align-top"
                    onClick={() => navigate(`/customers/${c._id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span>{c.name}</span>
                        {c.plan && (
                          <span className="text-xs font-normal text-muted-foreground whitespace-pre-wrap break-words">
                            {c.plan}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col gap-2">
                        <span className="whitespace-nowrap">{c.phone}</span>
                        <PhoneActions phone={c.phone} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={c.status} />
                        {trackingRows(c)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.latestRemark ? (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {c.latestRemark.text}
                        </p>
                      ) : (
                        <span className="italic">No remarks yet</span>
                      )}
                    </TableCell>
                    <TableCell>{todoList(c)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {isEmpty && emptyBlock}
      </div>
    </div>
  );
}
