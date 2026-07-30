import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { NewCustomerDialog } from "@/components/NewCustomerDialog";
import { PhoneActions } from "@/components/PhoneActions";
import { cn } from "@/lib/utils";
import {
  RocketIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

// Fixed "To-dos" checklist shared by every fast-track customer. `id`s are the
// stable tokens stored in customers.fastTrackTodos — keep them stable.
const FAST_TRACK_TODOS: { id: string; label: string }[] = [
  { id: "qr_on_table", label: "QR code on table" },
  { id: "wa_promotions", label: "WhatsApp promotions & comeback campaigns" },
  { id: "parcel_cards", label: "Parcel cards" },
  { id: "discounts", label: "Discounts" },
  { id: "direct_ordering_30d", label: "30 days Direct ordering promotion" },
  { id: "staff_training", label: "Staff training on call & dine" },
];

type FastTrackRow = NonNullable<
  ReturnType<typeof useFastTrackCustomers>
>[number];

// The subset of customer fields editable from this table. setFastTrackFields
// patches only the keys present, so per-field edits never clobber each other.
type FastTrackPatch = {
  needsPos?: boolean;
  needsPg?: boolean;
  needsPorter?: boolean;
  aggregatorOrders?: number;
  callOrders?: number;
  dineTakeawayOrders?: number;
  fastTrackTodos?: string[];
  websiteCreated?: boolean;
  websiteNote?: string;
  posConnected?: boolean;
  posNote?: string;
  pgConnected?: boolean;
  pgNote?: string;
  whatsappConnected?: boolean;
  whatsappNote?: string;
};

function useFastTrackCustomers(search: string) {
  return useQuery(api.customers.listFastTrack, {
    search: search.trim() || undefined,
  });
}

export function FastTrackCustomersPage() {
  const [search, setSearch] = useState("");
  const customers = useFastTrackCustomers(search);
  const statuses = useQuery(api.statuses.list);

  const isLoading = customers === undefined;
  const isEmpty = customers !== undefined && customers.length === 0;
  const filterActive = search.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <RocketIcon className="size-6 text-primary" />
            Fast-track customers
          </h2>
          <p className="text-sm text-muted-foreground">
            Promote a customer from the main list or add a new one — track their
            needs, website, POS, PG and WhatsApp connections here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeftIcon data-icon="inline-start" />
              All customers
            </Link>
          </Button>
          <NewCustomerDialog fastTrack>
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add fast-track customer
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
            placeholder="Search fast-track…"
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
                <Th className="sticky left-0 top-0 z-30 min-w-[220px] bg-card border-r">
                  Info
                </Th>
                <Th className="min-w-[240px]">Needs &amp; has</Th>
                <Th className="min-w-[240px]">To-dos</Th>
                <Th className="min-w-[220px]">Website created</Th>
                <Th className="min-w-[220px]">POS connection</Th>
                <Th className="min-w-[220px]">PG connection</Th>
                <Th className="min-w-[220px]">WhatsApp connection</Th>
                <Th className="min-w-[280px]">Status &amp; remark</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <Td className="sticky left-0 z-20 bg-card border-r">
                      <Skeleton className="h-24 w-full" />
                    </Td>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <Td key={j}>
                        <Skeleton className="h-24 w-full" />
                      </Td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                customers?.map((c) => (
                  <FastTrackRow key={c._id} customer={c} statuses={statuses} />
                ))}
            </tbody>
          </table>
        </div>

        {isEmpty && (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RocketIcon />
              </EmptyMedia>
              <EmptyTitle>
                {filterActive ? "No matches" : "No fast-track customers yet"}
              </EmptyTitle>
              <EmptyDescription>
                {filterActive
                  ? "Try a different search term."
                  : "Add a fast-track customer, or promote one from the main customers table."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {filterActive ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/">Go to all customers</Link>
                  </Button>
                  <NewCustomerDialog fastTrack>
                    <Button>
                      <PlusIcon data-icon="inline-start" />
                      Add fast-track customer
                    </Button>
                  </NewCustomerDialog>
                </div>
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

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b px-3 py-3 align-top", className)}>{children}</td>
  );
}

function FastTrackRow({
  customer: c,
  statuses,
}: {
  customer: FastTrackRow;
  statuses: Doc<"statuses">[] | undefined;
}) {
  const navigate = useNavigate();
  const setFields = useMutation(api.customers.setFastTrackFields);
  const setFastTrack = useMutation(api.customers.setFastTrack);

  async function save(patch: FastTrackPatch) {
    try {
      await setFields({ id: c._id, ...patch });
    } catch (err) {
      toast.error("Could not save");
      console.error(err);
    }
  }

  async function demote() {
    try {
      await setFastTrack({ id: c._id, fastTrack: false });
      toast.success(`Removed ${c.name} from fast-track`);
    } catch (err) {
      toast.error("Could not update");
      console.error(err);
    }
  }

  return (
    <tr className="group transition-colors hover:bg-muted/40">
      {/* 1 — Info */}
      <Td className="sticky left-0 z-20 bg-card border-r group-hover:bg-muted/40">
        <div className="flex flex-col items-start gap-2">
          <span className="font-medium">{c.name}</span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="whitespace-nowrap text-sm">{c.phone}</span>
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
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => navigate(`/customers/${c._id}`)}
            >
              Detail
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground"
              onClick={demote}
            >
              Remove
            </Button>
          </div>
        </div>
      </Td>

      {/* 2 — Needs & has */}
      <Td>
        <div className="flex flex-col gap-1.5">
          <NeedToggle
            label="POS connection"
            checked={!!c.needsPos}
            onChange={(v) => save({ needsPos: v })}
          />
          <NeedToggle
            label="PG needed"
            checked={!!c.needsPg}
            onChange={(v) => save({ needsPg: v })}
          />
          <NeedToggle
            label="Porter"
            checked={!!c.needsPorter}
            onChange={(v) => save({ needsPorter: v })}
          />
          <NumberField
            label="Aggregator orders / day"
            value={c.aggregatorOrders}
            onSave={(v) => save({ aggregatorOrders: v })}
          />
          <NumberField
            label="Call orders / day"
            value={c.callOrders}
            onSave={(v) => save({ callOrders: v })}
          />
          <NumberField
            label="Dine-in & takeaway / day"
            value={c.dineTakeawayOrders}
            onSave={(v) => save({ dineTakeawayOrders: v })}
          />
        </div>
      </Td>

      {/* 3 — To-dos checklist */}
      <Td>
        <TodoChecklistCell
          done={c.fastTrackTodos ?? []}
          onToggle={(next) => save({ fastTrackTodos: next })}
        />
      </Td>

      {/* 4 — Website created */}
      <Td>
        <ToggleNoteCell
          checked={!!c.websiteCreated}
          note={c.websiteNote ?? ""}
          onToggle={(v) => save({ websiteCreated: v })}
          onNote={(v) => save({ websiteNote: v })}
        />
      </Td>

      {/* 5 — POS connection */}
      <Td>
        <ToggleNoteCell
          checked={!!c.posConnected}
          note={c.posNote ?? ""}
          onToggle={(v) => save({ posConnected: v })}
          onNote={(v) => save({ posNote: v })}
        />
      </Td>

      {/* 6 — PG connection */}
      <Td>
        <ToggleNoteCell
          checked={!!c.pgConnected}
          note={c.pgNote ?? ""}
          onToggle={(v) => save({ pgConnected: v })}
          onNote={(v) => save({ pgNote: v })}
        />
      </Td>

      {/* 7 — WhatsApp connection */}
      <Td>
        <ToggleNoteCell
          checked={!!c.whatsappConnected}
          note={c.whatsappNote ?? ""}
          onToggle={(v) => save({ whatsappConnected: v })}
          onNote={(v) => save({ whatsappNote: v })}
        />
      </Td>

      {/* 8 — Status & remark */}
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
        </div>
      </Td>
    </tr>
  );
}

function NeedToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function TodoChecklistCell({
  done,
  onToggle,
}: {
  done: string[];
  onToggle: (next: string[]) => void;
}) {
  const doneSet = new Set(done);
  function toggle(id: string) {
    const next = doneSet.has(id)
      ? done.filter((d) => d !== id)
      : [...done, id];
    onToggle(next);
  }

  return (
    <ul className="flex flex-col gap-1">
      {FAST_TRACK_TODOS.map((t) => {
        const checked = doneSet.has(t.id);
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-muted/50"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                  checked
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-muted-foreground/40",
                )}
              >
                {checked && <CheckIcon className="size-3" />}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  checked && "text-muted-foreground line-through",
                )}
              >
                {t.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NumberField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number | undefined;
  onSave: (next: number) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");

  useEffect(() => {
    setDraft(value?.toString() ?? "");
  }, [value]);

  function commit() {
    const parsed = draft.trim() === "" ? 0 : Number(draft);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    if (next !== (value ?? 0)) onSave(next);
  }

  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 w-16 text-right text-sm"
      />
    </label>
  );
}

function ToggleNoteCell({
  checked,
  note,
  onToggle,
  onNote,
}: {
  checked: boolean;
  note: string;
  onToggle: (next: boolean) => void;
  onNote: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <Switch checked={checked} onCheckedChange={onToggle} />
        <span className="text-sm font-medium">{checked ? "Done" : "Not yet"}</span>
      </label>
      <CellField label="Note">
        <InlineEditable
          value={note}
          placeholder="Add note…"
          multiline
          onSave={async (next) => onNote(next)}
        />
      </CellField>
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
