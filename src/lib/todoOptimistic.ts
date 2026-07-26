// Optimistic updates for the todo mutations. Patching the local query cache
// makes an edit / toggle / delete show up instantly instead of waiting for the
// Convex round-trip — so a save reflects "at that time itself". Convex
// reconciles (or rolls back on error) once the real mutation resolves.
//
// TodoItem is rendered from three different queries (the customer detail
// `listByCustomer`, plus `listAll` / `listExtras` on the todos page), so every
// live instance of each is patched.

import { api } from "@convex/_generated/api";
import type { OptimisticLocalStore } from "convex/browser";
import type { Doc, Id } from "@convex/_generated/dataModel";

type TodoPatch = Partial<Pick<Doc<"todos">, "text" | "dueAt" | "done">>;

function patchEveryTodoQuery(
  localStore: OptimisticLocalStore,
  id: Id<"todos">,
  fn: <T extends Doc<"todos">>(todo: T) => T,
) {
  const queries = [
    api.todos.listByCustomer,
    api.todos.listExtras,
    api.todos.listAll,
  ] as const;

  for (const q of queries) {
    for (const { args, value } of localStore.getAllQueries(q)) {
      if (!value) continue;
      localStore.setQuery(
        q,
        args,
        value.map((t) => (t._id === id ? fn(t) : t)),
      );
    }
  }
}

export function updateTodoOptimistic(
  localStore: OptimisticLocalStore,
  { id, text, dueAt }: { id: Id<"todos">; text: string; dueAt?: number },
) {
  const patch: TodoPatch = { text, dueAt };
  patchEveryTodoQuery(localStore, id, (t) => ({ ...t, ...patch }));
}

export function toggleTodoOptimistic(
  localStore: OptimisticLocalStore,
  { id, done }: { id: Id<"todos">; done: boolean },
) {
  patchEveryTodoQuery(localStore, id, (t) => ({ ...t, done }));
}

export function removeTodoOptimistic(
  localStore: OptimisticLocalStore,
  { id }: { id: Id<"todos"> },
) {
  const queries = [
    api.todos.listByCustomer,
    api.todos.listExtras,
    api.todos.listAll,
  ] as const;

  for (const q of queries) {
    for (const { args, value } of localStore.getAllQueries(q)) {
      if (!value) continue;
      localStore.setQuery(
        q,
        args,
        value.filter((t) => t._id !== id),
      );
    }
  }
}
