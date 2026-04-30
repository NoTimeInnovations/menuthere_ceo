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
});
