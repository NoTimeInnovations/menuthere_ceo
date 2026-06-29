import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PHASES,
  Phase,
  PTask,
  phaseIndex,
  visibleGroups,
  getChoice,
  setChoiceTokens,
  phaseComplete,
  phaseTaskCounts,
  phaseTaskIds,
  phaseChoiceKeys,
} from "@/lib/phases";
import {
  CheckIcon,
  Cross2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

export function PhaseModal({
  customerId,
  name,
  currentPhaseId,
  maxPhaseId,
  tasks,
  choices,
  onClose,
}: {
  customerId: Id<"customers">;
  name: string;
  currentPhaseId: string | undefined;
  maxPhaseId: string | undefined;
  tasks: string[];
  choices: string[];
  onClose: () => void;
}) {
  const setProgress = useMutation(api.customers.setPhaseProgress);
  const curIdx = phaseIndex(currentPhaseId);
  const curId = PHASES[curIdx].id;
  // Furthest phase reached — never behind the current phase.
  const maxIdx = Math.max(phaseIndex(maxPhaseId), curIdx);
  const [viewId, setViewId] = useState<string>(curId);
  const viewIdx = phaseIndex(viewId);
  const phase = PHASES[viewIdx];
  const done = new Set(tasks);
  const complete = phaseComplete(phase, choices, done);
  const counts = phaseTaskCounts(phase, choices, done);
  const isLast = curIdx === PHASES.length - 1;
  const viewingCurrent = viewIdx === curIdx;

  async function persist(
    nextTasks: string[],
    nextChoices: string[],
    nextPhaseIdx: number,
    nextMaxIdx: number,
  ) {
    try {
      await setProgress({
        id: customerId,
        phase: PHASES[nextPhaseIdx].id,
        max: PHASES[Math.max(nextMaxIdx, nextPhaseIdx)].id,
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
    const target = curIdx < maxIdx ? maxIdx : Math.min(curIdx + 1, PHASES.length - 1);
    persist(tasks, choices, target, maxIdx);
    setViewId(PHASES[target].id);
    toast.success(`Moved to ${PHASES[target].label}`);
  }

  // Go back: clear all progress (tasks + decisions) of the current phase and make
  // the previous phase the current one. The furthest-reached pointer is kept, so
  // later phases' progress is untouched.
  function goBack() {
    if (curIdx <= 0) return;
    const cur = PHASES[curIdx];
    const clearTasks = new Set(phaseTaskIds(cur));
    const clearKeys = new Set(phaseChoiceKeys(cur));
    const nextTasks = tasks.filter((t) => !clearTasks.has(t));
    const nextChoices = choices.filter((c) => !clearKeys.has(c.split(":")[0]));
    persist(nextTasks, nextChoices, curIdx - 1, maxIdx);
    setViewId(PHASES[curIdx - 1].id);
    toast(`Moved back to ${PHASES[curIdx - 1].label} · cleared ${cur.label} progress`);
  }

  // Jump: make the phase you're previewing the current phase, WITHOUT erasing any
  // progress. Used to hop to e.g. Cashfree and back without losing work.
  function setAsCurrent() {
    persist(tasks, choices, viewIdx, maxIdx);
    toast.success(`Now working on ${PHASES[viewIdx].label}`);
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
                Currently on {PHASES[curIdx].label} · {PHASES[curIdx].title}
              </DialogPrimitive.Description>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
              <Cross2Icon />
            </Button>
          </div>

          {/* phase stepper — click any phase to preview it */}
          <div className="flex gap-2 overflow-x-auto border-b bg-muted/30 px-5 py-3">
            {PHASES.map((p, i) => {
              const isDone = i < curIdx;
              const isCurrent = i === curIdx;
              const isReachedAhead = i > curIdx && i <= maxIdx; // visited, now ahead of current
              const isViewing = i === viewIdx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setViewId(p.id)}
                  title={p.title}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isViewing ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "",
                    isDone && "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
                    isCurrent && "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
                    isReachedAhead && "border-primary/40 text-foreground",
                    !isDone && !isCurrent && !isReachedAhead && "bg-card text-muted-foreground",
                  )}
                >
                  {isDone && <CheckIcon className="size-3.5" />}
                  {isCurrent && <span className="size-2 rounded-full bg-blue-500" />}
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mx-auto max-w-4xl">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {phase.label} · {phase.title}
                </h2>
                {phase.intro && <p className="mt-1 text-sm text-muted-foreground">{phase.intro}</p>}
              </div>

              {/* decisions */}
              {phase.choices?.map((c) => {
                const val = getChoice(choices, c.key);
                return (
                  <div key={c.key} className="mb-4 rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/30">
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
              <PhaseGroups phase={phase} choices={choices} done={done} onToggle={toggleTask} />

              {phase.choices && phase.choices.some((c) => getChoice(choices, c.key) === undefined) && (
                <p className="mt-3 text-sm font-medium text-amber-600">
                  ↑ Answer the question above to see the tasks.
                </p>
              )}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <span className="text-sm text-muted-foreground">
              {viewingCurrent ? (
                <>
                  {counts.done}/{counts.total} tasks done
                  {complete && <span className="ml-2 font-medium text-green-600">· phase complete</span>}
                </>
              ) : (
                <span>
                  Previewing {phase.label} · working phase is {PHASES[curIdx].label}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!viewingCurrent ? (
                // Previewing another phase → let the user jump here (no progress lost)
                <Button onClick={setAsCurrent}>
                  Set {phase.label} as current
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              ) : (
                <>
                  {curIdx > 0 && (
                    <Button variant="outline" onClick={goBack}>
                      <ArrowLeftIcon data-icon="inline-start" />
                      Go back to {PHASES[curIdx - 1].label}
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
                        ? `Continue to latest · ${PHASES[maxIdx].label}`
                        : `Continue to ${PHASES[Math.min(curIdx + 1, PHASES.length - 1)].label}`}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

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
    <div className={cn("grid gap-4", phase.parallel && groups.length > 1 ? "md:grid-cols-2" : "grid-cols-1")}>
      {groups.map((g) => (
        <div key={g.id} className="rounded-lg border bg-card p-3">
          {g.label && <h3 className="mb-2 text-sm font-semibold">{g.label}</h3>}
          {g.note && <p className="mb-2 text-xs text-muted-foreground">{g.note}</p>}
          <ul className="flex flex-col gap-1.5">
            {g.tasks.map((t) => (
              <TaskItem key={t.id} task={t} checked={done.has(t.id)} onToggle={() => onToggle(t.id)} />
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
              checked ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/30",
            )}
          >
            {checked && <CheckIcon className="size-3.5" />}
          </span>
          <span className={cn(checked && "text-muted-foreground line-through")}>{task.label}</span>
        </button>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Hide details" : "Show details"}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Details
            <ChevronDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {hasDetails && open && (
        <ul className="flex flex-col gap-1 border-t bg-muted/30 px-3 py-2 pl-10">
          {task.details!.map((d, i) => (
            <li key={i} className="flex gap-2 text-xs leading-snug text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span className="whitespace-pre-wrap break-words">{d}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
