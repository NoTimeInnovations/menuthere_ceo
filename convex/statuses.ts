import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_STATUSES = [
  { name: "New Lead", color: "#3b82f6" },
  { name: "In Onboarding", color: "#a855f7" },
  { name: "App Live", color: "#10b981" },
  { name: "Follow-up", color: "#f59e0b" },
  { name: "No Reply", color: "#f97316" },
  { name: "Not Started", color: "#6b7280" },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db
      .query("statuses")
      .withIndex("by_order")
      .collect();
    return statuses;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { name, color }) => {
    const existing = await ctx.db.query("statuses").collect();
    const order = existing.length;
    return await ctx.db.insert("statuses", { name, color, order });
  },
});

export const update = mutation({
  args: {
    id: v.id("statuses"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { id, name, color }) => {
    await ctx.db.patch(id, { name, color });
  },
});

export const remove = mutation({
  args: { id: v.id("statuses") },
  handler: async (ctx, { id }) => {
    const inUse = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("statusId", id))
      .take(1);
    if (inUse.length > 0) {
      const all = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("statusId", id))
        .collect();
      throw new Error(
        `Cannot delete: ${all.length} customer${all.length === 1 ? "" : "s"} still use${all.length === 1 ? "s" : ""} this status. Reassign them first.`,
      );
    }
    await ctx.db.delete(id);
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("statuses").collect();
    const existingNames = new Set(existing.map((s) => s.name));
    let nextOrder = existing.length;
    for (const s of DEFAULT_STATUSES) {
      if (existingNames.has(s.name)) continue;
      await ctx.db.insert("statuses", { ...s, order: nextOrder++ });
    }
  },
});
