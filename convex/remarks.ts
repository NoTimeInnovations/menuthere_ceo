import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();
    const statuses = await ctx.db.query("statuses").collect();
    const statusMap = new Map(statuses.map((s) => [s._id, s]));
    return remarks.map((r) => ({
      ...r,
      status: r.statusIdAtTime ? statusMap.get(r.statusIdAtTime) ?? null : null,
    }));
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    text: v.string(),
  },
  handler: async (ctx, { customerId, text }) => {
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    return await ctx.db.insert("remarks", {
      customerId,
      text,
      statusIdAtTime: customer.statusId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("remarks"),
    text: v.string(),
  },
  handler: async (ctx, { id, text }) => {
    await ctx.db.patch(id, { text });
  },
});

export const remove = mutation({
  args: { id: v.id("remarks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
