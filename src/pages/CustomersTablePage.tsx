import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { NewCustomerDialog } from "@/components/NewCustomerDialog";
import { PhoneActions } from "@/components/PhoneActions";
import { PhaseModal } from "@/components/PhaseModal";
import {
  PHASES,
  currentPhase,
  phaseIndex,
  phaseTaskCounts,
  phaseComplete,
  visibleTasks,
  getChoice,
  setChoiceTokens,
} from "@/lib/phases";
import {
  CUSTOMER_TABLE_COLUMNS,
  TRACKING_STATUSES,
  TrackingKey,
  TrackingStatus,
  trackingStatusLabel,
  trackingStatusMeta,
} from "@/lib/tracking";
import { cn } from "@/lib/utils";
import {
  PersonIcon,
  PlusIcon,
  CopyIcon,
  ArrowRightIcon,
  CheckIcon,
  CheckboxIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

type CustomerRow = NonNullable<ReturnType<typeof useCustomers>>[number];

function useCustomers(search: string) {
  return useQuery(api.customers.list, {
    search: search.trim() || undefined,
  });
}

// Sticky left columns (# and Name) keep customers identifiable while the rest of
// the wide table scrolls horizontally.
const NUM_COL =
  "sticky left-0 z-20 w-12 bg-card group-hover:bg-muted/40";
const NAME_COL =
  "sticky left-12 z-20 min-w-[180px] bg-card border-r group-hover:bg-muted/40";
// Header cells are also sticky to the top, so they stay pinned while scrolling.
// Corner cells (#, Name) are sticky on both axes and sit above the rest (z-30).
const NUM_HEAD = "sticky left-0 top-0 z-30 w-12 bg-card";
const NAME_HEAD = "sticky left-12 top-0 z-30 min-w-[180px] bg-card border-r";

export function CustomersTablePage() {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<TrackingKey, TrackingStatus[]>>
  >({});
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const customers = useCustomers(search);
  const statuses = useQuery(api.statuses.list);
  const statusCounts = useQuery(api.statuses.withCounts);

  function toggleColumnFilter(key: TrackingKey, value: TrackingStatus) {
    setColumnFilters((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function toggleStatusFilter(id: string) {
    setStatusFilter((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setSearch("");
    setColumnFilters({});
    setStatusFilter([]);
  }

  const filtered = customers?.filter((c) => {
    if (statusFilter.length > 0 && !statusFilter.includes(c.statusId))
      return false;
    return CUSTOMER_TABLE_COLUMNS.every((col) => {
      const selected = columnFilters[col.key];
      if (!selected || selected.length === 0) return true;
      const value = (c[col.key] ?? "not_started") as TrackingStatus;
      return selected.includes(value);
    });
  });

  const isLoading = customers === undefined;
  const isEmpty = filtered !== undefined && filtered.length === 0;
  const filterActive =
    search.trim().length > 0 ||
    statusFilter.length > 0 ||
    Object.values(columnFilters).some((v) => v && v.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Customers table
          </h2>
          <p className="text-sm text-muted-foreground">
            Every customer with onboarding progress, status, remark and todo —
            editable inline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/customers">
              <ListBulletIcon data-icon="inline-start" />
              Board view
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/todos">
              <CheckboxIcon data-icon="inline-start" />
              Todos
            </Link>
          </Button>
          <NewCustomerDialog>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add customer
            </Button>
          </NewCustomerDialog>
        </div>
      </div>

      {statusCounts && statusCounts.some((s) => !s.hiddenInSummary) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {statusCounts
            .filter((s) => !s.hiddenInSummary)
            .map((s) => {
              const active = statusFilter.includes(s._id);
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => toggleStatusFilter(s._id)}
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

      <div className="sm:w-80">
        <InputGroup>
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search restaurants…"
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-card">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b">
                <Th className={NUM_HEAD}>#</Th>
                <Th className={NAME_HEAD}>Name</Th>
                <Th className="min-w-[180px]">Phone</Th>
                <Th className="min-w-[150px]">Phase</Th>
                <Th className="min-w-[280px]">Current phase tasks</Th>
                {CUSTOMER_TABLE_COLUMNS.map((col) => (
                  <ColumnFilterHead
                    key={col.key}
                    column={col}
                    selected={columnFilters[col.key] ?? []}
                    onToggle={(value) => toggleColumnFilter(col.key, value)}
                    onClear={() =>
                      setColumnFilters((prev) => ({ ...prev, [col.key]: [] }))
                    }
                  />
                ))}
                <StatusFilterHead
                  statuses={statuses}
                  selected={statusFilter}
                  onToggle={toggleStatusFilter}
                  onClear={() => setStatusFilter([])}
                />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <Td className={NUM_COL}>
                      <Skeleton className="h-4 w-4" />
                    </Td>
                    <Td className={NAME_COL}>
                      <Skeleton className="h-4 w-28" />
                    </Td>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <Td key={j}>
                        <Skeleton className="h-8 w-full" />
                      </Td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                filtered?.map((c, i) => (
                  <CustomerTableRow
                    key={c._id}
                    index={i}
                    customer={c}
                    statuses={statuses}
                  />
                ))}
            </tbody>
          </table>
        </div>

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
                  ? "Try a different search term or clear the filters."
                  : "Add your first customer to start tracking progress."}
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

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 h-11 whitespace-nowrap border-b bg-card px-3 text-left align-middle font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function ColumnFilterHead({
  column,
  selected,
  onToggle,
  onClear,
}: {
  column: { key: TrackingKey; label: string };
  selected: TrackingStatus[];
  onToggle: (value: TrackingStatus) => void;
  onClear: () => void;
}) {
  const active = selected.length > 0;
  return (
    <th className="sticky top-0 z-10 h-11 min-w-[150px] whitespace-nowrap border-b bg-card px-3 text-left align-middle font-medium text-muted-foreground">
      <div className="flex items-center justify-between gap-1">
        <span>{column.label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7 shrink-0",
                active && "bg-primary/10 text-primary hover:text-primary",
              )}
              aria-label={`Filter ${column.label}`}
            >
              <MixerHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter {column.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TRACKING_STATUSES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.value}
                checked={selected.includes(s.value)}
                onCheckedChange={() => onToggle(s.value)}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {trackingStatusLabel(column.key, s.value)}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
            {active && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={onClear}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Clear
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </th>
  );
}

function StatusFilterHead({
  statuses,
  selected,
  onToggle,
  onClear,
}: {
  statuses: Doc<"statuses">[] | undefined;
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const active = selected.length > 0;
  return (
    <th className="sticky top-0 z-10 h-11 min-w-[300px] whitespace-nowrap border-b bg-card px-3 text-left align-middle font-medium text-muted-foreground">
      <div className="flex items-center justify-between gap-1">
        <span>Status / Remark / Todo</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7 shrink-0",
                active && "bg-primary/10 text-primary hover:text-primary",
              )}
              aria-label="Filter status"
            >
              <MixerHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-72 w-48 overflow-y-auto"
          >
            <DropdownMenuLabel>Filter status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses?.map((s) => (
              <DropdownMenuCheckboxItem
                key={s._id}
                checked={selected.includes(s._id)}
                onCheckedChange={() => onToggle(s._id)}
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
            {active && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={onClear}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Clear
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b px-3 py-2.5 align-top", className)}>
      {children}
    </td>
  );
}

function CustomerTableRow({
  index,
  customer: c,
  statuses,
}: {
  index: number;
  customer: CustomerRow;
  statuses: Doc<"statuses">[] | undefined;
}) {
  const navigate = useNavigate();
  const firstTodo = c.todos[0];

  return (
    <tr className="group transition-colors hover:bg-muted/40">
      <Td className={cn(NUM_COL, "tabular-nums text-muted-foreground")}>
        <span className="block pt-1.5">{index + 1}</span>
      </Td>
      <Td className={NAME_COL}>
        <div className="flex flex-col items-start gap-1.5 pt-0.5">
          <span className="font-medium">{c.name}</span>
          {c.plan && (
            <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
              {c.plan}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => navigate(`/customers/${c._id}`)}
          >
            Detail
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </Td>

      <Td className="text-muted-foreground">
        <div className="flex flex-col gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">{c.phone}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Copy phone number"
              onClick={async () => {
                await navigator.clipboard.writeText(c.phone);
                toast.success("Phone number copied");
              }}
            >
              <CopyIcon />
            </Button>
          </div>
          <PhoneActions phone={c.phone} />
        </div>
      </Td>

      <Td>
        <PhaseCell customer={c} />
      </Td>

      <Td>
        <PhaseTasksCell customer={c} />
      </Td>

      {CUSTOMER_TABLE_COLUMNS.map((col) => (
        <Td key={col.key}>
          <TrackingSelect
            customerId={c._id}
            columnKey={col.key}
            value={c[col.key]}
          />
        </Td>
      ))}

      <Td>
        <div className="flex flex-col gap-2">
          <StatusSelect
            customerId={c._id}
            currentStatusId={c.statusId}
            statuses={statuses}
          />
          <CellField label="Remark">
            <RemarkEditor
              customerId={c._id}
              remarkId={c.latestRemark?._id}
              value={c.latestRemark?.text ?? ""}
            />
          </CellField>
          <CellField label="Todo">
            <TodoEditor
              customerId={c._id}
              todoId={firstTodo?._id}
              value={firstTodo?.text ?? ""}
              dueAt={firstTodo?.dueAt}
            />
          </CellField>
        </div>
      </Td>
    </tr>
  );
}

function PhaseCell({ customer: c }: { customer: CustomerRow }) {
  const [open, setOpen] = useState(false);
  const choices = c.phaseChoices ?? [];
  const tasks = c.phaseTasks ?? [];
  const done = new Set(tasks);
  const ph = currentPhase(c.phase);
  const counts = phaseTaskCounts(ph, choices, done);
  const complete = phaseComplete(ph, choices, done);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col items-start gap-1 rounded-md border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-sm font-semibold">{ph.label}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              complete ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground",
            )}
          >
            {counts.done}/{counts.total}
          </span>
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{ph.title}</span>
      </button>
      {open && (
        <PhaseModal
          customerId={c._id}
          name={c.name}
          currentPhaseId={c.phase}
          maxPhaseId={c.phaseMax}
          tasks={tasks}
          choices={choices}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Inline task list + Continue for the customer's CURRENT phase — complete the
// phase and advance without opening the modal.
function PhaseTasksCell({ customer: c }: { customer: CustomerRow }) {
  const setProgress = useMutation(api.customers.setPhaseProgress);
  const choices = c.phaseChoices ?? [];
  const tasks = c.phaseTasks ?? [];
  const done = new Set(tasks);
  const curIdx = phaseIndex(c.phase);
  const maxIdx = Math.max(phaseIndex(c.phaseMax), curIdx);
  const phase = PHASES[curIdx];
  const vTasks = visibleTasks(phase, choices);
  const complete = phaseComplete(phase, choices, done);
  const isLast = curIdx === PHASES.length - 1;
  const unanswered = (phase.choices ?? []).filter(
    (ch) => getChoice(choices, ch.key) === undefined,
  );
  const target = curIdx < maxIdx ? maxIdx : Math.min(curIdx + 1, PHASES.length - 1);

  async function persist(
    nextTasks: string[],
    nextChoices: string[],
    targetIdx: number,
  ) {
    try {
      await setProgress({
        id: c._id,
        phase: PHASES[targetIdx].id,
        max: PHASES[Math.max(maxIdx, targetIdx)].id,
        tasks: nextTasks,
        choices: nextChoices,
      });
    } catch (err) {
      toast.error("Could not save");
      console.error(err);
    }
  }
  function toggle(tid: string) {
    const next = done.has(tid) ? tasks.filter((t) => t !== tid) : [...tasks, tid];
    persist(next, choices, curIdx);
  }
  function choose(key: string, value: string) {
    persist(tasks, setChoiceTokens(choices, key, value), curIdx);
  }
  function cont() {
    persist(tasks, choices, target);
    toast.success(`Moved to ${PHASES[target].label}`);
  }

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      {/* decisions that gate the tasks */}
      {unanswered.map((ch) => (
        <div key={ch.key} className="rounded-md border border-amber-300 bg-amber-50 p-2 dark:bg-amber-950/30">
          <p className="mb-1 text-xs font-medium">{ch.question}</p>
          <div className="flex flex-wrap gap-1">
            {ch.options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => choose(ch.key, o.value)}
                className="rounded border bg-card px-2 py-0.5 text-xs font-medium hover:bg-muted"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* current phase tasks */}
      {vTasks.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {vTasks.map((t) => {
            const checked = done.has(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                      checked ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/40",
                    )}
                  >
                    {checked && <CheckIcon className="size-3" />}
                  </span>
                  <span className={cn("leading-snug", checked && "text-muted-foreground line-through")}>
                    {t.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        unanswered.length === 0 && (
          <span className="text-xs italic text-muted-foreground">No tasks in this phase</span>
        )
      )}

      {/* continue */}
      {isLast ? (
        <Button
          size="sm"
          className="h-7 bg-green-600 hover:bg-green-700"
          disabled={!complete}
          onClick={() => toast.success(`${c.name} is live! 🎉`)}
        >
          {complete ? "Live 🎉" : "Complete all tasks"}
        </Button>
      ) : (
        <Button size="sm" className="h-7" disabled={!complete} onClick={cont}>
          Continue → {PHASES[target].label}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      )}
    </div>
  );
}

function CellField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function TrackingSelect({
  customerId,
  columnKey,
  value,
}: {
  customerId: Id<"customers">;
  columnKey: TrackingKey;
  value: string | undefined;
}) {
  const setTracking = useMutation(api.customers.setTracking);
  const current = value ?? "not_started";
  const meta = trackingStatusMeta(current);

  async function handleChange(next: string) {
    try {
      await setTracking({
        id: customerId,
        key: columnKey,
        value: next as TrackingStatus,
      });
    } catch (err) {
      toast.error("Could not update");
      console.error(err);
    }
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-8">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="truncate">
            {trackingStatusLabel(columnKey, current)}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TRACKING_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {trackingStatusLabel(columnKey, s.value)}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function StatusSelect({
  customerId,
  currentStatusId,
  statuses,
}: {
  customerId: Id<"customers">;
  currentStatusId: Id<"statuses">;
  statuses: Doc<"statuses">[] | undefined;
}) {
  const changeStatus = useMutation(api.customers.changeStatus);
  const current = statuses?.find((s) => s._id === currentStatusId);

  async function handleChange(next: string) {
    if (next === currentStatusId) return;
    try {
      await changeStatus({
        id: customerId,
        statusId: next as Id<"statuses">,
      });
    } catch (err) {
      toast.error("Could not change status");
      console.error(err);
    }
  }

  return (
    <Select value={currentStatusId} onValueChange={handleChange}>
      <SelectTrigger className="h-8">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: current?.color ?? "#94a3b8" }}
          />
          <span className="truncate font-medium">
            {current?.name ?? "Unknown"}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        <SelectGroup>
          {statuses?.map((s) => (
            <SelectItem key={s._id} value={s._id}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function RemarkEditor({
  customerId,
  remarkId,
  value,
}: {
  customerId: Id<"customers">;
  remarkId: Id<"remarks"> | undefined;
  value: string;
}) {
  const createRemark = useMutation(api.remarks.create);
  const updateRemark = useMutation(api.remarks.update);
  const removeRemark = useMutation(api.remarks.remove);

  async function handleSave(next: string) {
    if (next) {
      if (remarkId) {
        await updateRemark({ id: remarkId, text: next });
      } else {
        await createRemark({ customerId, text: next });
      }
    } else if (remarkId) {
      await removeRemark({ id: remarkId });
    }
  }

  return (
    <InlineEditable
      value={value}
      placeholder="Add remark…"
      multiline
      onSave={handleSave}
    />
  );
}

function TodoEditor({
  customerId,
  todoId,
  value,
  dueAt,
}: {
  customerId: Id<"customers">;
  todoId: Id<"todos"> | undefined;
  value: string;
  dueAt: number | undefined;
}) {
  const createTodo = useMutation(api.todos.create);
  const updateTodo = useMutation(api.todos.update);
  const removeTodo = useMutation(api.todos.remove);

  async function handleSave(next: string) {
    if (next) {
      if (todoId) {
        await updateTodo({ id: todoId, text: next, dueAt });
      } else {
        await createTodo({ customerId, text: next });
      }
    } else if (todoId) {
      await removeTodo({ id: todoId });
    }
  }

  return (
    <InlineEditable value={value} placeholder="Add todo…" onSave={handleSave} />
  );
}

function InlineEditable({
  value,
  placeholder,
  multiline,
  onSave,
}: {
  value: string;
  placeholder: string;
  multiline?: boolean;
  onSave: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  async function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next === value.trim()) {
      setDraft(value);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
    } catch (err) {
      toast.error("Could not save");
      console.error(err);
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    const shared = {
      autoFocus: true,
      value: draft,
      disabled: saving,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setDraft(e.target.value),
      onBlur: commit,
    };
    return multiline ? (
      <Textarea
        {...shared}
        rows={3}
        className="min-h-0 resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
      />
    ) : (
      <Input
        {...shared}
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "w-full rounded-md border border-transparent px-2 py-1 text-left text-sm hover:border-input hover:bg-muted/40",
        !value && "text-muted-foreground italic",
      )}
    >
      <span className="whitespace-pre-wrap break-words">
        {value || placeholder}
      </span>
    </button>
  );
}
