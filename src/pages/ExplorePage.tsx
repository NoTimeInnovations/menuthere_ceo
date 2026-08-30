import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useNow } from "@/lib/useNow";
import { toLocalInputValue, fromLocalInputValue } from "@/lib/due";
import { parseExploreFile, callDateTone } from "@/lib/exploreImport";
import {
  ExploreRow,
  listExplore,
  importExplore,
  updateExplore,
  removeExplore,
} from "@/lib/exploreApi";
import { cn } from "@/lib/utils";
import {
  GlobeIcon,
  UploadIcon,
  CopyIcon,
  ExternalLinkIcon,
  TrashIcon,
  Cross2Icon,
  ArrowLeftIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

export function ExplorePage() {
  const [rows, setRows] = useState<ExploreRow[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listExplore();
      setRows(data);
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError(
        "Couldn't reach the Explore service. Is `npm run dev:worker` running?",
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Optimistic local patch so inline edits feel instant; the API call persists.
  const patchLocal = useCallback((id: string, fields: Partial<ExploreRow>) => {
    setRows((prev) =>
      prev?.map((r) => (r._id === id ? { ...r, ...fields } : r)),
    );
  }, []);

  const dropLocal = useCallback((id: string) => {
    setRows((prev) => prev?.filter((r) => r._id !== id));
  }, []);

  async function handleFile(file: File) {
    setImporting(true);
    try {
      const result = await parseExploreFile(file);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { imported, skipped } = await importExplore(result.rows);
      if (imported === 0) {
        toast.info(
          skipped > 0
            ? `Nothing new — all ${skipped} restaurant(s) already imported.`
            : "No restaurants imported.",
        );
      } else {
        toast.success(
          `Imported ${imported} restaurant(s)${
            skipped > 0 ? ` · skipped ${skipped} already present` : ""
          }.`,
        );
      }
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("Import failed.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const isLoading = rows === undefined && !loadError;
  const isEmpty = rows !== undefined && rows.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Explore</h2>
          <p className="text-sm text-muted-foreground">
            Import a Zomato export and work the list — capture a new contact, a
            remark, and the next date to call. Stored in Cloudflare.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeftIcon data-icon="inline-start" />
              Customers
            </Link>
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={importing}>
            <UploadIcon data-icon="inline-start" />
            {importing ? "Importing…" : "Import Excel"}
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <ReloadIcon data-icon="inline-start" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-card">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1240px] table-fixed caption-bottom border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <Th className="w-[48px]">#</Th>
                <Th className="w-[240px]">Restaurant</Th>
                <Th className="w-[190px]">Restaurant number</Th>
                <Th className="w-[200px]">New contact</Th>
                <Th className="w-[260px]">Remark</Th>
                <Th className="w-[250px]">Next date to call</Th>
                <Th className="w-[52px]" />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <Td>
                      <Skeleton className="h-4 w-4" />
                    </Td>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <Td key={j}>
                        <Skeleton className="h-8 w-full" />
                      </Td>
                    ))}
                  </tr>
                ))}

              {rows?.map((row, i) => (
                <ExploreTableRow
                  key={row._id}
                  index={i}
                  row={row}
                  onPatchLocal={patchLocal}
                  onDropLocal={dropLocal}
                  onRefresh={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>

        {isEmpty && (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GlobeIcon />
              </EmptyMedia>
              <EmptyTitle>No restaurants yet</EmptyTitle>
              <EmptyDescription>
                Import a Zomato export (.xlsx / .csv) to start exploring. The
                headers must match the standard export.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                <UploadIcon data-icon="inline-start" />
                Import Excel
              </Button>
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
  children?: React.ReactNode;
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
    <td className={cn("border-b px-3 py-2.5 align-top", className)}>
      {children}
    </td>
  );
}

function ExploreTableRow({
  index,
  row,
  onPatchLocal,
  onDropLocal,
  onRefresh,
}: {
  index: number;
  row: ExploreRow;
  onPatchLocal: (id: string, fields: Partial<ExploreRow>) => void;
  onDropLocal: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const now = useNow();
  const tone = callDateTone(row.nextCallAt, now);

  async function saveField(fields: {
    newContact?: string;
    remark?: string;
    nextCallAt?: number | null;
  }) {
    // Optimistic: reflect immediately, persist in the background.
    onPatchLocal(row._id, {
      ...("newContact" in fields ? { newContact: fields.newContact } : {}),
      ...("remark" in fields ? { remark: fields.remark } : {}),
      ...("nextCallAt" in fields
        ? { nextCallAt: fields.nextCallAt ?? undefined }
        : {}),
    });
    try {
      await updateExplore(row._id, fields);
    } catch (err) {
      console.error(err);
      toast.error("Could not save");
      void onRefresh();
    }
  }

  async function handleDelete() {
    onDropLocal(row._id);
    try {
      await removeExplore(row._id);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete");
      void onRefresh();
    }
  }

  return (
    <tr className="group transition-colors hover:bg-muted/40">
      <Td className="tabular-nums text-muted-foreground">
        <span className="block pt-1.5">{index + 1}</span>
      </Td>

      <Td>
        <div className="flex flex-col items-start gap-1.5 pt-0.5">
          <span className="font-medium break-words">{row.name}</span>
          {row.zomatoLink && (
            <Button variant="outline" size="sm" className="h-7" asChild>
              <a href={row.zomatoLink} target="_blank" rel="noreferrer">
                <ExternalLinkIcon data-icon="inline-start" />
                Zomato
              </a>
            </Button>
          )}
        </div>
      </Td>

      <Td className="text-muted-foreground">
        <div className="flex items-start gap-1.5 pt-0.5">
          <span className="whitespace-pre-wrap break-words">
            {row.phone || <span className="italic">—</span>}
          </span>
          {row.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Copy number"
              onClick={async () => {
                await navigator.clipboard.writeText(row.phone);
                toast.success("Number copied");
              }}
            >
              <CopyIcon />
            </Button>
          )}
        </div>
      </Td>

      <Td>
        <InlineEditable
          value={row.newContact ?? ""}
          placeholder="Add contact…"
          onSave={(next) => saveField({ newContact: next })}
        />
      </Td>

      <Td>
        <InlineEditable
          value={row.remark ?? ""}
          placeholder="Add remark…"
          multiline
          onSave={(next) => saveField({ remark: next })}
        />
      </Td>

      <Td>
        <div className="flex items-center gap-1.5 pt-0.5">
          <Input
            type="datetime-local"
            value={row.nextCallAt ? toLocalInputValue(row.nextCallAt) : ""}
            aria-label="Next date to call"
            onChange={(e) => {
              const v = e.target.value;
              void saveField({
                nextCallAt: v ? fromLocalInputValue(v) : null,
              });
            }}
            className={cn(
              "w-[190px]",
              tone === "overdue" &&
                "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
              tone === "soon" &&
                "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
            )}
          />
          {row.nextCallAt && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Clear date"
              onClick={() => void saveField({ nextCallAt: null })}
            >
              <Cross2Icon />
            </Button>
          )}
        </div>
      </Td>

      <Td>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          aria-label="Delete row"
          onClick={handleDelete}
        >
          <TrashIcon />
        </Button>
      </Td>
    </tr>
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
