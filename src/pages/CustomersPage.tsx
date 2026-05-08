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
} from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

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
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(loadInitialStatusFilters);

  useEffect(() => {
    window.localStorage.setItem(STATUS_FILTER_KEY, JSON.stringify(statusFilters));
  }, [statusFilters]);

  const statuses = useQuery(api.statuses.list);
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <InputGroup className="sm:w-72">
            <InputGroupAddon>
              <MagnifyingGlassIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Cross2Icon />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>

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

        <div className="flex items-center gap-2">
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[140px]">Phone</TableHead>
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
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {c.phone}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge status={c.status} />
                      {TRACKING_ITEMS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap"
                        >
                          <span>{label}:</span>
                          <TrackingStatusBadge value={c[key]} />
                        </div>
                      ))}
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
                  <TableCell>
                    {c.todos.length === 0 ? (
                      <span className="text-sm italic text-muted-foreground">
                        No todos
                      </span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {c.todos.map((t) => (
                          <li
                            key={t._id}
                            className={
                              t.done
                                ? "flex gap-2 text-sm text-muted-foreground whitespace-pre-wrap break-words leading-snug line-through"
                                : "flex gap-2 text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-snug"
                            }
                          >
                            <span aria-hidden>•</span>
                            <span>{t.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {isEmpty && (
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
        )}
      </div>
    </div>
  );
}
