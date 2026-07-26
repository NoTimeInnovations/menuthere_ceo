// Optimistic updates for the remark mutations, so editing / deleting a timeline
// entry reflects instantly instead of waiting for the Convex round-trip. Convex
// reconciles (or rolls back on error) once the real mutation resolves.
//
// Remarks are read via `remarks.listByCustomer`, cached once per customer, so
// every live instance is patched.

import { api } from "@convex/_generated/api";
import type { OptimisticLocalStore } from "convex/browser";
import type { Id } from "@convex/_generated/dataModel";

export function updateRemarkOptimistic(
  localStore: OptimisticLocalStore,
  { id, text }: { id: Id<"remarks">; text: string },
) {
  for (const { args, value } of localStore.getAllQueries(
    api.remarks.listByCustomer,
  )) {
    if (!value) continue;
    localStore.setQuery(
      api.remarks.listByCustomer,
      args,
      value.map((r) => (r._id === id ? { ...r, text } : r)),
    );
  }
}

export function removeRemarkOptimistic(
  localStore: OptimisticLocalStore,
  { id }: { id: Id<"remarks"> },
) {
  for (const { args, value } of localStore.getAllQueries(
    api.remarks.listByCustomer,
  )) {
    if (!value) continue;
    localStore.setQuery(
      api.remarks.listByCustomer,
      args,
      value.filter((r) => r._id !== id),
    );
  }
}
