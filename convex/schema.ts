import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  statuses: defineTable({
    name: v.string(),
    color: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    statusId: v.id("statuses"),
    priority: v.optional(v.number()),
    playStore: v.optional(v.string()),
    appStore: v.optional(v.string()),
    cashfree: v.optional(v.string()),
    posIntegration: v.optional(v.string()),
  })
    .index("by_status", ["statusId"])
    .index("by_priority", ["priority"])
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
  }).index("by_customer", ["customerId"]),
});
