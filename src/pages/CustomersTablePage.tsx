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
const NUM_HEAD = "sticky left-0 z-30 w-12 bg-card";
const NAME_HEAD = "sticky left-12 z-30 min-w-[180px] bg-card border-r";

export function CustomersTablePage() {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<TrackingKey, TrackingStatus[]>>
  >({});

  const customers = useCustomers(search);
  const statuses = useQuery(api.statuses.list);

  function toggleColumnFilter(key: TrackingKey, value: TrackingStatus) {
    setColumnFilters((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function clearFilters() {
    setSearch("");
    setColumnFilters({});
  }

  const filtered = customers?.filter((c) =>
    CUSTOMER_TABLE_COLUMNS.every((col) => {
      const selected = columnFilters[col.key];
      if (!selected || selected.length === 0) return true;
      const value = (c[col.key] ?? "not_started") as TrackingStatus;
      return selected.includes(value);
    }),
  );

  const isLoading = customers === undefined;
  const isEmpty = filtered !== undefined && filtered.length === 0;
  const filterActive =
    search.trim().length > 0 ||
    Object.values(columnFilters).some((v) => v && v.length > 0);

  return (
    <div className="flex flex-col gap-6">
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
            <Link to="/">
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

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b">
                <Th className={NUM_HEAD}>#</Th>
                <Th className={NAME_HEAD}>Name</Th>
                <Th className="min-w-[180px]">Phone</Th>
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
                <Th className="min-w-[300px]">Status / Remark / Todo</Th>
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
                    {Array.from({ length: 6 }).map((__, j) => (
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
        "h-11 whitespace-nowrap border-b px-3 text-left align-middle font-medium text-muted-foreground",
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
    <th className="h-11 min-w-[150px] whitespace-nowrap border-b px-3 text-left align-middle font-medium text-muted-foreground">
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
      <SelectContent>
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
