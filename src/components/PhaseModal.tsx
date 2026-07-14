import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Phase,
  PChoice,
  PGroup,
  PTask,
  phaseIndex,
  visibleGroups,
  getChoice,
  setChoiceTokens,
  phaseComplete,
  phaseTaskCounts,
  phaseTaskIds,
  phaseChoiceKeys,
  newId,
} from "@/lib/phases";
import {
  phaseProgressOptimistic,
  updatePhaseMetaOptimistic,
  setPhaseGroupsOptimistic,
  setPhaseChoicesOptimistic,
  reorderPhasesOptimistic,
} from "@/lib/phaseOptimistic";
import {
  CheckIcon,
  Cross2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
  ChevronDownIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

function cleanConvexError(err: unknown): string {
  const message = err instanceof Error ? err.message : "Something went wrong";
  return message.replace(/^\[CONVEX [^\]]+\]\s*/, "").split("\n")[0];
}

// Radix Select forbids empty-string item values, so "always visible" needs a
// non-empty sentinel.
const ALWAYS_SHOW = "__always__";

export function PhaseModal({
  customerId,
  name,
  phases,
  currentPhaseId,
  maxPhaseId,
  tasks,
  choices,
  onClose,
}: {
  customerId: Id<"customers">;
  name: string;
  phases: Phase[];
  currentPhaseId: string | undefined;
  maxPhaseId: string | undefined;
  tasks: string[];
  choices: string[];
  onClose: () => void;
}) {
  const setProgress = useMutation(
    api.customers.setPhaseProgress,
  ).withOptimisticUpdate(phaseProgressOptimistic);

  const curIdx = phaseIndex(phases, currentPhaseId);
  const curId = phases[curIdx].id;
  // Furthest phase reached — never behind the current phase.
  const maxIdx = Math.max(phaseIndex(phases, maxPhaseId), curIdx);
  const [viewId, setViewId] = useState<string>(curId);
  const [editing, setEditing] = useState(false);
  const viewIdx = phaseIndex(phases, viewId);
  const phase = phases[viewIdx];
  const done = new Set(tasks);
  const complete = phaseComplete(phase, choices, done);
  const counts = phaseTaskCounts(phase, choices, done);
  const isLast = curIdx === phases.length - 1;
  const viewingCurrent = viewIdx === curIdx;
  const lastLabel = phases[phases.length - 1].label;

  async function persist(
    nextTasks: string[],
    nextChoices: string[],
    nextPhaseIdx: number,
    nextMaxIdx: number,
  ) {
    try {
      await setProgress({
        id: customerId,
        phase: phases[nextPhaseIdx].id,
        max: phases[Math.max(nextMaxIdx, nextPhaseIdx)].id,
        tasks: nextTasks,
        choices: nextChoices,
      });
    } catch (err) {
      toast.error("Could not save");
      console.error(err);
    }
  }

  function toggleTask(tid: string) {
    const next = done.has(tid) ? tasks.filter((t) => t !== tid) : [...tasks, tid];
    persist(next, choices, curIdx, maxIdx);
  }
  function setChoice(key: string, value: string) {
    persist(tasks, setChoiceTokens(choices, key, value), curIdx, maxIdx);
  }

  // Continue from the current phase. If the current phase is BEHIND the furthest
  // reached (you jumped back to redo something), Continue returns you to the
  // latest phase. Otherwise it advances one phase and extends the furthest.
  function continueNext() {
    const target =
      curIdx < maxIdx ? maxIdx : Math.min(curIdx + 1, phases.length - 1);
    persist(tasks, choices, target, maxIdx);
    setViewId(phases[target].id);
    toast.success(`Moved to ${phases[target].label}`);
  }

  // Go back: clear all progress (tasks + decisions) of the current phase and make
  // the previous phase the current one. The furthest-reached pointer is kept, so
  // later phases' progress is untouched.
  function goBack() {
    if (curIdx <= 0) return;
    const cur = phases[curIdx];
    const clearTasks = new Set(phaseTaskIds(cur));
    const clearKeys = new Set(phaseChoiceKeys(cur));
    const nextTasks = tasks.filter((t) => !clearTasks.has(t));
    const nextChoices = choices.filter((c) => !clearKeys.has(c.split(":")[0]));
    persist(nextTasks, nextChoices, curIdx - 1, maxIdx);
    setViewId(phases[curIdx - 1].id);
    toast(
      `Moved back to ${phases[curIdx - 1].label} · cleared ${cur.label} progress`,
    );
  }

  // Jump: make the phase you're previewing the current phase, WITHOUT erasing any
  // progress. Used to hop to e.g. Cashfree and back without losing work.
  function setAsCurrent() {
    persist(tasks, choices, viewIdx, maxIdx);
    toast.success(`Now working on ${phases[viewIdx].label}`);
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-background outline-none">
          {/* header */}
          <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-lg font-semibold">
                {name} — Onboarding phases
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-muted-foreground">
                {editing ? (
                  <span className="font-medium text-amber-600">
                    Editing the checklist — changes apply to every customer
                  </span>
                ) : (
                  <>
                    Currently on {phases[curIdx].label} · {phases[curIdx].title}
                  </>
                )}
              </DialogPrimitive.Description>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant={editing ? "default" : "outline"}
                size="sm"
                onClick={() => setEditing((e) => !e)}
              >
                {editing ? (
                  <>
                    <CheckIcon data-icon="inline-start" />
                    Done editing
                  </>
                ) : (
                  <>
                    <Pencil1Icon data-icon="inline-start" />
                    Edit phases
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={onClose}
              >
                <Cross2Icon />
              </Button>
            </div>
          </div>

          {/* phase stepper — click any phase to preview / edit it */}
          <div className="flex gap-2 overflow-x-auto border-b bg-muted/30 px-5 py-3">
            {phases.map((p, i) => {
              const isDone = i < curIdx;
              const isCurrent = i === curIdx;
              const isReachedAhead = i > curIdx && i <= maxIdx; // visited, now ahead
              const isViewing = i === viewIdx;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setViewId(p.id)}
                  title={p.title}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isViewing
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "",
                    !editing &&
                      isDone &&
                      "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
                    !editing &&
                      isCurrent &&
                      "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
                    !editing && isReachedAhead && "border-primary/40 text-foreground",
                    (editing || (!isDone && !isCurrent && !isReachedAhead)) &&
                      "bg-card text-muted-foreground",
                  )}
                >
                  {!editing && isDone && <CheckIcon className="size-3.5" />}
                  {!editing && isCurrent && (
                    <span className="size-2 rounded-full bg-blue-500" />
                  )}
                  {p.label}
                </button>
              );
            })}
            {editing && <AddPhaseButton phases={phases} onView={setViewId} />}
          </div>

          {/* body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mx-auto max-w-4xl">
              {editing ? (
                <PhaseEditor
                  key={phase.key}
                  phases={phases}
                  phase={phase}
                  viewIdx={viewIdx}
                  onView={setViewId}
                />
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">
                      {phase.label} · {phase.title}
                    </h2>
                    {phase.intro && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {phase.intro}
                      </p>
                    )}
                  </div>

                  {/* decisions */}
                  {phase.choices?.map((c) => {
                    const val = getChoice(choices, c.key);
                    return (
                      <div
                        key={c.key}
                        className="mb-4 rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/30"
                      >
                        <p className="mb-2 text-sm font-semibold">{c.question}</p>
                        <div className="flex flex-wrap gap-2">
                          {c.options.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => setChoice(c.key, o.value)}
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                                val === o.value
                                  ? "border-amber-500 bg-amber-500 text-amber-950"
                                  : "bg-card hover:bg-muted",
                              )}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* task groups */}
                  <PhaseGroups
                    phase={phase}
                    choices={choices}
                    done={done}
                    onToggle={toggleTask}
                  />

                  {phase.choices &&
                    phase.choices.some(
                      (c) => getChoice(choices, c.key) === undefined,
                    ) && (
                      <p className="mt-3 text-sm font-medium text-amber-600">
                        ↑ Answer the question above to see the tasks.
                      </p>
                    )}
                </>
              )}
            </div>
          </div>

          {/* footer — hidden while editing (edits auto-save) */}
          {!editing && (
            <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
              <span className="text-sm text-muted-foreground">
                {viewingCurrent ? (
                  <>
                    {counts.done}/{counts.total} tasks done
                    {complete && (
                      <span className="ml-2 font-medium text-green-600">
                        · phase complete
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    Previewing {phase.label} · working phase is{" "}
                    {phases[curIdx].label}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {!viewingCurrent ? (
                  <Button onClick={setAsCurrent}>
                    Set {phase.label} as current
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                ) : (
                  <>
                    {curIdx > 0 && (
                      <Button variant="outline" onClick={goBack}>
                        <ArrowLeftIcon data-icon="inline-start" />
                        Go back to {phases[curIdx - 1].label}
                      </Button>
                    )}
                    {isLast ? (
                      <Button
                        disabled={!complete}
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => toast.success(`${name} is live! 🎉`)}
                      >
                        <CheckCircledIcon data-icon="inline-start" />
                        {complete ? "Live 🎉" : "Complete all tasks"}
                      </Button>
                    ) : (
                      <Button disabled={!complete} onClick={continueNext}>
                        {curIdx < maxIdx
                          ? `Continue to latest · ${lastLabel}`
                          : `Continue to ${
                              phases[Math.min(curIdx + 1, phases.length - 1)].label
                            }`}
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Progress mode (read + check off tasks)
// ---------------------------------------------------------------------------

function PhaseGroups({
  phase,
  choices,
  done,
  onToggle,
}: {
  phase: Phase;
  choices: string[];
  done: Set<string>;
  onToggle: (id: string) => void;
}) {
  const groups = visibleGroups(phase, choices);
  return (
    <div
      className={cn(
        "grid gap-4",
        phase.parallel && groups.length > 1 ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {groups.map((g) => (
        <div key={g.id} className="rounded-lg border bg-card p-3">
          {g.label && <h3 className="mb-2 text-sm font-semibold">{g.label}</h3>}
          {g.note && <p className="mb-2 text-xs text-muted-foreground">{g.note}</p>}
          <ul className="flex flex-col gap-1.5">
            {g.tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                checked={done.has(t.id)}
                onToggle={() => onToggle(t.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TaskItem({
  task,
  checked,
  onToggle,
}: {
  task: PTask;
  checked: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!task.details?.length;
  return (
    <li
      className={cn(
        "rounded-md border transition-colors",
        checked ? "border-green-500/50 bg-green-500/5" : "border-border",
      )}
    >
      <div className="flex items-start gap-2.5 p-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left text-sm"
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2",
              checked
                ? "border-green-500 bg-green-500 text-white"
                : "border-muted-foreground/30",
            )}
          >
            {checked && <CheckIcon className="size-3.5" />}
          </span>
          <span className={cn(checked && "text-muted-foreground line-through")}>
            {task.label}
          </span>
        </button>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Hide details" : "Show details"}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Details
            <ChevronDownIcon
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>
      {hasDetails && open && (
        <ul className="flex flex-col gap-1 border-t bg-muted/30 px-3 py-2 pl-10">
          {task.details!.map((d, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs leading-snug text-muted-foreground"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span className="whitespace-pre-wrap break-words">{d}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Edit mode (change the shared checklist for all customers)
// ---------------------------------------------------------------------------

function AddPhaseButton({
  phases,
  onView,
}: {
  phases: Phase[];
  onView: (id: string) => void;
}) {
  const createPhase = useMutation(api.phases.createPhase);
  async function add() {
    const key = newId("phase");
    try {
      await createPhase({ key, title: "New phase" });
      onView(key);
      toast.success("Phase added — edit it below");
    } catch (err) {
      toast.error(cleanConvexError(err));
    }
  }
  return (
    <button
      type="button"
      onClick={add}
      className="flex shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground"
      title={`Add a phase after ${phases[phases.length - 1].label}`}
    >
      <PlusIcon className="size-3.5" />
      Add phase
    </button>
  );
}

function PhaseEditor({
  phases,
  phase,
  viewIdx,
  onView,
}: {
  phases: Phase[];
  phase: Phase;
  viewIdx: number;
  onView: (id: string) => void;
}) {
  const updateMeta = useMutation(api.phases.updatePhaseMeta).withOptimisticUpdate(
    updatePhaseMetaOptimistic,
  );
  const setGroups = useMutation(api.phases.setPhaseGroups).withOptimisticUpdate(
    setPhaseGroupsOptimistic,
  );
  const setChoicesM = useMutation(
    api.phases.setPhaseChoices,
  ).withOptimisticUpdate(setPhaseChoicesOptimistic);
  const reorderPhases = useMutation(
    api.phases.reorderPhases,
  ).withOptimisticUpdate(reorderPhasesOptimistic);
  const removePhase = useMutation(api.phases.removePhase);

  function commitMeta(next: {
    title?: string;
    intro?: string;
    parallel?: boolean;
  }) {
    updateMeta({
      id: phase._id,
      title: next.title ?? phase.title,
      intro: next.intro ?? phase.intro,
      parallel: next.parallel ?? phase.parallel,
    }).catch((err) => toast.error(cleanConvexError(err)));
  }

  function saveGroups(groups: PGroup[]) {
    setGroups({ id: phase._id, groups }).catch((err) =>
      toast.error(cleanConvexError(err)),
    );
  }
  function saveChoices(choices: PChoice[]) {
    setChoicesM({ id: phase._id, choices }).catch((err) =>
      toast.error(cleanConvexError(err)),
    );
  }

  function mapGroups(fn: (groups: PGroup[]) => PGroup[]) {
    saveGroups(fn(phase.groups));
  }

  // --- group ops ---
  function addGroup() {
    mapGroups((gs) => [...gs, { id: newId("grp"), tasks: [] }]);
  }
  function deleteGroup(gid: string) {
    mapGroups((gs) => gs.filter((g) => g.id !== gid));
  }
  function moveGroup(gid: string, dir: -1 | 1) {
    mapGroups((gs) => {
      const i = gs.findIndex((g) => g.id === gid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= gs.length) return gs;
      const next = gs.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function editGroup(gid: string, patch: Partial<PGroup>) {
    mapGroups((gs) => gs.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  }

  // --- task ops ---
  function addTask(gid: string) {
    mapGroups((gs) =>
      gs.map((g) =>
        g.id === gid
          ? { ...g, tasks: [...g.tasks, { id: newId("task"), label: "New task" }] }
          : g,
      ),
    );
  }
  function deleteTask(gid: string, tid: string) {
    mapGroups((gs) =>
      gs.map((g) =>
        g.id === gid ? { ...g, tasks: g.tasks.filter((t) => t.id !== tid) } : g,
      ),
    );
  }
  function moveTask(gid: string, tid: string, dir: -1 | 1) {
    mapGroups((gs) =>
      gs.map((g) => {
        if (g.id !== gid) return g;
        const i = g.tasks.findIndex((t) => t.id === tid);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= g.tasks.length) return g;
        const tasks = g.tasks.slice();
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
        return { ...g, tasks };
      }),
    );
  }
  function editTask(gid: string, tid: string, patch: Partial<PTask>) {
    mapGroups((gs) =>
      gs.map((g) =>
        g.id === gid
          ? {
              ...g,
              tasks: g.tasks.map((t) => (t.id === tid ? { ...t, ...patch } : t)),
            }
          : g,
      ),
    );
  }

  async function deletePhase() {
    if (phases.length <= 1) {
      toast.error("Keep at least one phase.");
      return;
    }
    const neighbor = phases[viewIdx + 1] ?? phases[viewIdx - 1];
    try {
      await removePhase({ id: phase._id });
      if (neighbor) onView(neighbor.id);
      toast.success("Phase deleted");
    } catch (err) {
      toast.error(cleanConvexError(err));
    }
  }
  function movePhase(dir: -1 | 1) {
    const to = viewIdx + dir;
    if (to < 0 || to >= phases.length) return;
    const ids = phases.map((p) => p._id);
    [ids[viewIdx], ids[to]] = [ids[to], ids[viewIdx]];
    reorderPhases({ ids }).catch((err) => toast.error(cleanConvexError(err)));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* phase-level controls */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-muted px-2 py-1 text-xs font-semibold">
            {phase.label}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => movePhase(-1)}
              disabled={viewIdx === 0}
              aria-label="Move phase earlier"
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => movePhase(1)}
              disabled={viewIdx === phases.length - 1}
              aria-label="Move phase later"
            >
              <ArrowRightIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={deletePhase}
              disabled={phases.length <= 1}
              aria-label="Delete phase"
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
        <EditableText
          value={phase.title}
          onCommit={(v) => commitMeta({ title: v })}
          placeholder="Phase title"
          className="text-base font-semibold"
        />
        <EditableText
          value={phase.intro ?? ""}
          onCommit={(v) => commitMeta({ intro: v })}
          placeholder="Short intro (optional)"
          multiline
        />
        <button
          type="button"
          onClick={() => commitMeta({ parallel: !phase.parallel })}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded border-2",
              phase.parallel
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30",
            )}
          >
            {phase.parallel && <CheckIcon className="size-3.5" />}
          </span>
          Show sections side by side (parallel)
        </button>
      </div>

      {/* decisions editor */}
      <ChoicesEditor phase={phase} onSave={saveChoices} />

      {/* groups + tasks editor */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Sections & tasks</h3>
          <Button variant="outline" size="sm" onClick={addGroup}>
            <PlusIcon data-icon="inline-start" />
            Add section
          </Button>
        </div>
        {phase.groups.length === 0 && (
          <p className="text-sm italic text-muted-foreground">
            No sections yet — add one to start listing tasks.
          </p>
        )}
        {phase.groups.map((g, gi) => (
          <GroupEditor
            key={g.id}
            group={g}
            index={gi}
            total={phase.groups.length}
            choices={phase.choices ?? []}
            onAddTask={() => addTask(g.id)}
            onDeleteTask={(tid) => deleteTask(g.id, tid)}
            onMoveTask={(tid, dir) => moveTask(g.id, tid, dir)}
            onEditTask={(tid, patch) => editTask(g.id, tid, patch)}
            onEditGroup={(patch) => editGroup(g.id, patch)}
            onDeleteGroup={() => deleteGroup(g.id)}
            onMoveGroup={(dir) => moveGroup(g.id, dir)}
          />
        ))}
      </div>
    </div>
  );
}

function ChoicesEditor({
  phase,
  onSave,
}: {
  phase: Phase;
  onSave: (choices: PChoice[]) => void;
}) {
  const choices = phase.choices ?? [];

  function map(fn: (cs: PChoice[]) => PChoice[]) {
    onSave(fn(choices));
  }
  function addChoice() {
    map((cs) => [
      ...cs,
      {
        key: newId("dec"),
        question: "New decision?",
        options: [
          { value: newId("opt"), label: "Option A" },
          { value: newId("opt"), label: "Option B" },
        ],
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300/70 bg-amber-50/60 p-3 dark:bg-amber-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Decisions</h3>
        <Button variant="outline" size="sm" onClick={addChoice}>
          <PlusIcon data-icon="inline-start" />
          Add decision
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        A decision (e.g. “Petpooja?”) can gate which section shows below.
      </p>
      {choices.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No decisions.</p>
      ) : (
        choices.map((c) => (
          <div
            key={c.key}
            className="flex flex-col gap-2 rounded-md border bg-card p-2.5"
          >
            <div className="flex items-start gap-2">
              <EditableText
                value={c.question}
                onCommit={(v) =>
                  map((cs) =>
                    cs.map((x) =>
                      x.key === c.key ? { ...x, question: v } : x,
                    ),
                  )
                }
                placeholder="Question"
                className="text-sm font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive hover:text-destructive"
                aria-label="Delete decision"
                onClick={() => map((cs) => cs.filter((x) => x.key !== c.key))}
              >
                <TrashIcon />
              </Button>
            </div>
            <div className="flex flex-col gap-1.5 pl-1">
              {c.options.map((o) => (
                <div key={o.value} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">•</span>
                  <EditableText
                    value={o.label}
                    onCommit={(v) =>
                      map((cs) =>
                        cs.map((x) =>
                          x.key === c.key
                            ? {
                                ...x,
                                options: x.options.map((oo) =>
                                  oo.value === o.value ? { ...oo, label: v } : oo,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                    placeholder="Option label"
                    className="text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground"
                    aria-label="Delete option"
                    disabled={c.options.length <= 1}
                    onClick={() =>
                      map((cs) =>
                        cs.map((x) =>
                          x.key === c.key
                            ? {
                                ...x,
                                options: x.options.filter(
                                  (oo) => oo.value !== o.value,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <Cross2Icon />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  map((cs) =>
                    cs.map((x) =>
                      x.key === c.key
                        ? {
                            ...x,
                            options: [
                              ...x.options,
                              { value: newId("opt"), label: "New option" },
                            ],
                          }
                        : x,
                    ),
                  )
                }
                className="ml-3 w-fit text-xs font-medium text-primary hover:underline"
              >
                + Add option
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function GroupEditor({
  group,
  index,
  total,
  choices,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onEditTask,
  onEditGroup,
  onDeleteGroup,
  onMoveGroup,
}: {
  group: PGroup;
  index: number;
  total: number;
  choices: PChoice[];
  onAddTask: () => void;
  onDeleteTask: (tid: string) => void;
  onMoveTask: (tid: string, dir: -1 | 1) => void;
  onEditTask: (tid: string, patch: Partial<PTask>) => void;
  onEditGroup: (patch: Partial<PGroup>) => void;
  onDeleteGroup: () => void;
  onMoveGroup: (dir: -1 | 1) => void;
}) {
  // showWhen select value encodes "choiceKey::optionValue" (or "" for always).
  const showWhenValue = group.showWhen
    ? `${group.showWhen.key}::${group.showWhen.value}`
    : "";
  const showWhenOptions = choices.flatMap((c) =>
    c.options.map((o) => ({
      value: `${c.key}::${o.value}`,
      label: `${c.question} → ${o.label}`,
    })),
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <EditableText
          value={group.label ?? ""}
          onCommit={(v) => onEditGroup({ label: v.trim() ? v : undefined })}
          placeholder="Section heading (optional)"
          className="text-sm font-semibold"
        />
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onMoveGroup(-1)}
            disabled={index === 0}
            aria-label="Move section up"
          >
            <ArrowLeftIcon className="rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onMoveGroup(1)}
            disabled={index === total - 1}
            aria-label="Move section down"
          >
            <ArrowRightIcon className="rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDeleteGroup}
            aria-label="Delete section"
          >
            <TrashIcon />
          </Button>
        </div>
      </div>

      {choices.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Show only when:</span>
          <Select
            value={showWhenValue || ALWAYS_SHOW}
            onValueChange={(v) => {
              if (v === ALWAYS_SHOW) {
                onEditGroup({ showWhen: undefined });
              } else {
                const [key, value] = v.split("::");
                onEditGroup({ showWhen: { key, value } });
              }
            }}
          >
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALWAYS_SHOW}>Always show</SelectItem>
              {showWhenOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {group.tasks.map((t, ti) => (
          <TaskEditor
            key={t.id}
            task={t}
            index={ti}
            total={group.tasks.length}
            onDelete={() => onDeleteTask(t.id)}
            onMove={(dir) => onMoveTask(t.id, dir)}
            onEdit={(patch) => onEditTask(t.id, patch)}
          />
        ))}
      </ul>

      <Button variant="outline" size="sm" className="w-fit" onClick={onAddTask}>
        <PlusIcon data-icon="inline-start" />
        Add task
      </Button>
    </div>
  );
}

function TaskEditor({
  task,
  index,
  total,
  onDelete,
  onMove,
  onEdit,
}: {
  task: PTask;
  index: number;
  total: number;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onEdit: (patch: Partial<PTask>) => void;
}) {
  const details = task.details ?? [];

  function commitDetail(i: number, value: string) {
    const trimmed = value.trim();
    let next: string[];
    if (!trimmed) {
      next = details.filter((_, idx) => idx !== i);
    } else {
      next = details.map((d, idx) => (idx === i ? value : d));
    }
    onEdit({ details: next.length ? next : undefined });
  }
  function addDetail() {
    onEdit({ details: [...details, ""] });
  }

  return (
    <li className="rounded-md border border-border bg-background p-2.5">
      <div className="flex items-start gap-2">
        <EditableText
          value={task.label}
          onCommit={(v) => onEdit({ label: v })}
          placeholder="Task label"
          className="text-sm"
        />
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move task up"
          >
            <ArrowLeftIcon className="rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move task down"
          >
            <ArrowRightIcon className="rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete task"
          >
            <Cross2Icon />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1 pl-1">
        {details.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="mt-0 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
            <EditableText
              value={d}
              onCommit={(v) => commitDetail(i, v)}
              placeholder="Detail line (blank to remove)"
              className="text-xs text-muted-foreground"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addDetail}
          className="ml-3 w-fit text-xs font-medium text-primary hover:underline"
        >
          + Add detail
        </button>
      </div>
    </li>
  );
}

// Text field that keeps a local draft while focused and commits on blur, so
// edits don't fire a mutation per keystroke and the caret never jumps.
function EditableText({
  value,
  onCommit,
  placeholder,
  multiline,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  function commit() {
    setFocused(false);
    if (draft !== value) onCommit(draft);
  }

  const shared = {
    value: draft,
    placeholder,
    onFocus: () => setFocused(true),
    onBlur: commit,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setDraft(e.target.value),
  };

  if (multiline) {
    return (
      <Textarea
        {...shared}
        rows={2}
        className={cn("min-h-0 flex-1 resize-none", className)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
      />
    );
  }
  return (
    <Input
      {...shared}
      className={cn("h-8 flex-1", className)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
