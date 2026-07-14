// Optimistic update for `customers.setPhaseProgress`. Patching the local query
// cache makes a task checkbox / decision flip instantly on click instead of
// waiting for the Convex round-trip — so the UI never feels laggy and the user
// isn't tempted to click twice. Convex reconciles (or rolls back on error)
// once the real mutation resolves.

import { api } from "@convex/_generated/api";
import type { OptimisticLocalStore } from "convex/browser";
import type { Doc, Id } from "@convex/_generated/dataModel";

type PhaseProgressArgs = {
  id: Id<"customers">;
  phase: string;
  max: string;
  tasks: string[];
  choices: string[];
};

export function phaseProgressOptimistic(
  localStore: OptimisticLocalStore,
  args: PhaseProgressArgs,
) {
  const patch = {
    phase: args.phase,
    phaseMax: args.max,
    phaseTasks: args.tasks,
    phaseChoices: args.choices,
  };

  // `customers.list` is cached once per distinct arg set (search / statusIds),
  // so patch every live instance.
  for (const { args: qArgs, value } of localStore.getAllQueries(
    api.customers.list,
  )) {
    if (!value) continue;
    localStore.setQuery(
      api.customers.list,
      qArgs,
      value.map((c) => (c._id === args.id ? { ...c, ...patch } : c)),
    );
  }

  // Keep the detail query consistent too, if it happens to be open.
  const got = localStore.getQuery(api.customers.get, { id: args.id });
  if (got) {
    localStore.setQuery(
      api.customers.get,
      { id: args.id },
      { ...got, ...patch },
    );
  }
}

// --- Phase-definition editor optimism ---------------------------------------
// The editor mutates one existing phase doc at a time, so patching the cached
// `phases.list` makes every edit (rename, add/remove task, reorder…) show up
// instantly and — because the whole app reads that one query — globally.

type PhaseDoc = Doc<"phases">;

function patchPhaseInList(
  localStore: OptimisticLocalStore,
  id: Id<"phases">,
  fn: (doc: PhaseDoc) => PhaseDoc,
) {
  const value = localStore.getQuery(api.phases.list, {});
  if (!value) return;
  localStore.setQuery(
    api.phases.list,
    {},
    value.map((d) => (d._id === id ? fn(d) : d)),
  );
}

export function updatePhaseMetaOptimistic(
  localStore: OptimisticLocalStore,
  args: {
    id: Id<"phases">;
    title: string;
    intro?: string;
    parallel?: boolean;
  },
) {
  patchPhaseInList(localStore, args.id, (d) => ({
    ...d,
    title: args.title.trim() || "Untitled phase",
    intro: args.intro?.trim() ? args.intro.trim() : undefined,
    parallel: args.parallel ? true : undefined,
  }));
}

export function setPhaseGroupsOptimistic(
  localStore: OptimisticLocalStore,
  args: { id: Id<"phases">; groups: PhaseDoc["groups"] },
) {
  patchPhaseInList(localStore, args.id, (d) => ({ ...d, groups: args.groups }));
}

export function setPhaseChoicesOptimistic(
  localStore: OptimisticLocalStore,
  args: { id: Id<"phases">; choices: NonNullable<PhaseDoc["choices"]> },
) {
  patchPhaseInList(localStore, args.id, (d) => ({
    ...d,
    choices: args.choices.length > 0 ? args.choices : undefined,
  }));
}

export function reorderPhasesOptimistic(
  localStore: OptimisticLocalStore,
  args: { ids: Id<"phases">[] },
) {
  const value = localStore.getQuery(api.phases.list, {});
  if (!value) return;
  const byId = new Map(value.map((d) => [d._id, d]));
  const next = args.ids
    .map((id, i) => {
      const d = byId.get(id);
      return d ? { ...d, order: i } : undefined;
    })
    .filter((d): d is PhaseDoc => d !== undefined);
  localStore.setQuery(api.phases.list, {}, next);
}
