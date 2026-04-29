import { useState } from "react";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { NewCustomerDialog } from "@/components/NewCustomerDialog";
import { ManageStatusesDialog } from "@/components/ManageStatusesDialog";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Cross2Icon,
  PersonIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";

const ALL = "__all__";

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const statuses = useQuery(api.statuses.list);
  const customers = useQuery(api.customers.list, {
    search: search || undefined,
    statusId:
      statusFilter !== ALL ? (statusFilter as Id<"statuses">) : undefined,
  });

  const isLoading = customers === undefined;
  const isEmpty = customers !== undefined && customers.length === 0;
  const filterActive = search.trim().length > 0 || statusFilter !== ALL;

  function clearFilters() {
    setSearch("");
    setStatusFilter(ALL);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>
        <p className="text-sm text-muted-foreground">
          Track every customer, status and remark in one place.
        </p>
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>All statuses</SelectItem>
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

          {filterActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
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
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Added</TableHead>
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
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading &&
              customers?.map((c) => (
                <TableRow
                  key={c._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/customers/${c._id}`)}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(c._creationTime).toLocaleDateString()}
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
