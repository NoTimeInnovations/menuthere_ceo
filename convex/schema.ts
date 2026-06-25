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
  })
    .index("by_status", ["statusId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["statusId"],
    }),

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
