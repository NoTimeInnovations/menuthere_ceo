// Runtime types + helpers for the onboarding "Phase" checklist.
//
// The phase definitions themselves live in Convex (the `phases` table) so they
// can be edited globally at runtime — see `convex/phases.ts` and the editor in
// `PhaseModal`. This module only holds the shared TS shapes and the pure logic
// that computes visibility / completion from a customer's saved progress.

import type { Doc, Id } from "@convex/_generated/dataModel";

export interface PTask {
  id: string;
  label: string;
  details?: string[]; // expandable step-by-step detail
}
export interface PChoice {
  key: string; // e.g. "petpooja"
  question: string;
  options: { value: string; label: string }[];
}
export interface PGroup {
  id: string;
  label?: string; // section heading (used when a phase has 2+ sections)
  note?: string;
  showWhen?: { key: string; value: string }; // only show when this decision matches
  tasks: PTask[];
}
export interface Phase {
  _id: Id<"phases">; // Convex document id — used by the editor
  key: string; // stable id referenced by customer progress
  id: string; // alias of `key` (kept so existing display code reads `p.id`)
  label: string; // short badge text, derived from position ("Phase 1")
  title: string; // full title
  intro?: string;
  parallel?: boolean; // render the groups side-by-side
  choices?: PChoice[];
  groups: PGroup[];
}

export type PhaseDoc = Doc<"phases">;

// Build the display list from DB docs. The short label ("Phase N") is derived
// from position so inserting / reordering / deleting phases always stays
// sequential — the stored data never carries a stale "Phase 3" label.
export function toRuntimePhases(docs: PhaseDoc[]): Phase[] {
  return docs.map((d, i) => ({
    _id: d._id,
    key: d.key,
    id: d.key,
    label: `Phase ${i + 1}`,
    title: d.title,
    intro: d.intro,
    parallel: d.parallel,
    choices: d.choices,
    groups: d.groups,
  }));
}

// Generate a stable, unique id for a new phase / group / task / choice / option.
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function phaseIndex(
  phases: Phase[],
  phaseId: string | undefined,
): number {
  if (!phaseId) return 0;
  const i = phases.findIndex((p) => p.id === phaseId);
  return i < 0 ? 0 : i;
}

export function currentPhase(
  phases: Phase[],
  phaseId: string | undefined,
): Phase {
  return phases[phaseIndex(phases, phaseId)];
}

// "key:value" decision tokens ------------------------------------------------
export function getChoice(choices: string[], key: string): string | undefined {
  const pre = key + ":";
  const found = choices.find((c) => c.startsWith(pre));
  return found ? found.slice(pre.length) : undefined;
}
export function setChoiceTokens(
  choices: string[],
  key: string,
  value: string,
): string[] {
  const pre = key + ":";
  return [...choices.filter((c) => !c.startsWith(pre)), pre + value];
}

// Which groups are visible for the current decisions.
export function visibleGroups(phase: Phase, choices: string[]): PGroup[] {
  return phase.groups.filter(
    (g) => !g.showWhen || getChoice(choices, g.showWhen.key) === g.showWhen.value,
  );
}
export function visibleTasks(phase: Phase, choices: string[]): PTask[] {
  return visibleGroups(phase, choices).flatMap((g) => g.tasks);
}

// A phase is complete when every required decision is answered and every visible
// task is checked.
export function phaseComplete(
  phase: Phase,
  choices: string[],
  done: Set<string>,
): boolean {
  const choicesAnswered = (phase.choices ?? []).every(
    (c) => getChoice(choices, c.key) !== undefined,
  );
  if (!choicesAnswered) return false;
  const tasks = visibleTasks(phase, choices);
  return tasks.every((t) => done.has(t.id));
}

export function phaseTaskCounts(
  phase: Phase,
  choices: string[],
  done: Set<string>,
): { done: number; total: number } {
  const tasks = visibleTasks(phase, choices);
  return { done: tasks.filter((t) => done.has(t.id)).length, total: tasks.length };
}

// All task ids defined in a phase (across every group, regardless of visibility).
export function phaseTaskIds(phase: Phase): string[] {
  return phase.groups.flatMap((g) => g.tasks.map((t) => t.id));
}
// All decision keys that belong to a phase.
export function phaseChoiceKeys(phase: Phase): string[] {
  return (phase.choices ?? []).map((c) => c.key);
}
