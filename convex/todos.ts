import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    return await ctx.db
      .query("todos")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").order("desc").collect();
    const customers = await ctx.db.query("customers").collect();
    const statuses = await ctx.db.query("statuses").collect();
    const customerMap = new Map(customers.map((c) => [c._id, c]));
    const statusMap = new Map(statuses.map((s) => [s._id, s]));
    return todos
      .filter((t) => t.customerId !== undefined)
      .map((t) => {
        const customer = t.customerId
          ? customerMap.get(t.customerId) ?? null
          : null;
        return {
          ...t,
          customer: customer
            ? {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                status: statusMap.get(customer.statusId) ?? null,
              }
            : null,
        };
      });
  },
});

export const listExtras = query({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_customer", (q) => q.eq("customerId", undefined))
      .order("desc")
      .collect();
    return todos;
  },
});

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    text: v.string(),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, { customerId, text, dueAt }) => {
    if (customerId) {
      const customer = await ctx.db.get(customerId);
      if (!customer) throw new Error("Customer not found");
    }
    return await ctx.db.insert("todos", {
      customerId,
      text,
      done: false,
      dueAt,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("todos"),
    text: v.string(),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, { id, text, dueAt }) => {
    await ctx.db.patch(id, { text, dueAt });
  },
});

export const setDue = mutation({
  args: {
    id: v.id("todos"),
    dueAt: v.number(),
  },
  handler: async (ctx, { id, dueAt }) => {
    await ctx.db.patch(id, {
      dueAt,
      notifiedAt30m: undefined,
      notifiedAtDue: undefined,
    });
  },
});

export const listForBanner = query({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();
    const customers = await ctx.db.query("customers").collect();
    const customerMap = new Map(customers.map((c) => [c._id, c]));
    return todos
      .filter((t) => !t.done && t.dueAt !== undefined)
      .map((t) => {
        const customer = t.customerId ? customerMap.get(t.customerId) : null;
        return {
          _id: t._id,
          text: t.text,
          dueAt: t.dueAt!,
          customer: customer
            ? { _id: customer._id, name: customer.name }
            : null,
        };
      });
  },
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
    done: v.boolean(),
  },
  handler: async (ctx, { id, done }) => {
    await ctx.db.patch(id, { done });
  },
});

export const remove = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
