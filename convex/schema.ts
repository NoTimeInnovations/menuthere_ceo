import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  statuses: defineTable({
    name: v.string(),
    color: v.string(),
    order: v.number(),
    hiddenInSummary: v.optional(v.boolean()),
  }).index("by_order", ["order"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    statusId: v.id("statuses"),
    // Deprecated: customer-level priority was removed; the list now orders by
    // status priority. Kept optional so existing docs still validate.
    priority: v.optional(v.number()),
    plan: v.optional(v.string()),
    playStore: v.optional(v.string()),
    appStore: v.optional(v.string()),
    cashfree: v.optional(v.string()),
    posIntegration: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    // Onboarding phase tracking (table-view "Phase" column).
    //   phase        = id of the customer's current (working) phase (undefined = Phase 1)
    //   phaseMax     = id of the furthest phase reached (so a jump-back can return to it)
    //   phaseTasks   = ids of completed sub-tasks across all phases
    //   phaseChoices = decision answers, stored as "key:value" (e.g. "petpooja:yes")
    phase: v.optional(v.string()),
    phaseMax: v.optional(v.string()),
    phaseTasks: v.optional(v.array(v.string())),
    phaseChoices: v.optional(v.array(v.string())),
    // Deprecated visual-flow fields (kept optional for back-compat with old docs).
    flowStep: v.optional(v.string()),
    flowDone: v.optional(v.array(v.string())),
    flowSkips: v.optional(v.array(v.string())),

    // ── Fast-track program (see /fast-track-customers) ──────────────────────
    // A customer promoted into (or created for) the fast-track workflow.
    fastTrack: v.optional(v.boolean()),
    // "Needs & has" assessment. First three are yes/no; the order fields are
    // per-day counts.
    needsPos: v.optional(v.boolean()),
    needsPg: v.optional(v.boolean()),
    needsPorter: v.optional(v.boolean()),
    aggregatorOrders: v.optional(v.number()),
    callOrders: v.optional(v.number()),
    dineTakeawayOrders: v.optional(v.number()),
    // Fast-track "To-dos" checklist — ids of the completed items (the item
    // template lives in src/lib/fastTrack.ts).
    fastTrackTodos: v.optional(v.array(v.string())),
    // Fast-track work progress — each is a toggle plus a free-text note.
    websiteCreated: v.optional(v.boolean()),
    websiteNote: v.optional(v.string()),
    posConnected: v.optional(v.boolean()),
    posNote: v.optional(v.string()),
    pgConnected: v.optional(v.boolean()),
    pgNote: v.optional(v.string()),
    whatsappConnected: v.optional(v.boolean()),
    whatsappNote: v.optional(v.string()),
  })
    .index("by_status", ["statusId"])
    .index("by_fast_track", ["fastTrack"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["statusId"],
    }),

  // Onboarding phase definitions — the checklist template shared by every
  // customer. One document per phase; `key` is the stable string id that a
  // customer's progress (`customers.phase`, `phaseMax`, `phaseTasks`,
  // `phaseChoices`) points at, so keys/ids must stay stable across edits.
  phases: defineTable({
    key: v.string(),
    order: v.number(),
    title: v.string(),
    intro: v.optional(v.string()),
    parallel: v.optional(v.boolean()),
    choices: v.optional(
      v.array(
        v.object({
          key: v.string(),
          question: v.string(),
          options: v.array(
            v.object({ value: v.string(), label: v.string() }),
          ),
        }),
      ),
    ),
    groups: v.array(
      v.object({
        id: v.string(),
        label: v.optional(v.string()),
        note: v.optional(v.string()),
        showWhen: v.optional(v.object({ key: v.string(), value: v.string() })),
        tasks: v.array(
          v.object({
            id: v.string(),
            label: v.string(),
            details: v.optional(v.array(v.string())),
          }),
        ),
      }),
    ),
  }).index("by_order", ["order"]),

  remarks: defineTable({
    customerId: v.id("customers"),
    text: v.string(),
    statusIdAtTime: v.optional(v.id("statuses")),
  }).index("by_customer", ["customerId"]),

  todos: defineTable({
    customerId: v.optional(v.id("customers")),
    text: v.string(),
    done: v.boolean(),
    dueAt: v.optional(v.number()),
    notifiedAt30m: v.optional(v.boolean()),
    notifiedAtDue: v.optional(v.boolean()),
  }).index("by_customer", ["customerId"]),
});
