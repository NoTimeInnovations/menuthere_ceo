import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export type CustomerWithStatus = Doc<"customers"> & {
  status: Doc<"statuses"> | null;
  latestRemark: Doc<"remarks"> | null;
};

export const list = query({
  args: {
    search: v.optional(v.string()),
    statusId: v.optional(v.id("statuses")),
  },
  handler: async (ctx, { search, statusId }) => {
    let customers: Doc<"customers">[];

    const trimmed = search?.trim();
    if (trimmed && trimmed.length > 0) {
      customers = await ctx.db
        .query("customers")
        .withSearchIndex("search_name", (q) => {
          const base = q.search("name", trimmed);
          return statusId ? base.eq("statusId", statusId) : base;
        })
        .take(200);
    } else if (statusId) {
      customers = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("statusId", statusId))
        .order("desc")
        .take(200);
    } else {
      customers = await ctx.db.query("customers").order("desc").take(200);
    }

    const statuses = await ctx.db.query("statuses").collect();
    const statusMap = new Map(statuses.map((s) => [s._id, s]));
    return Promise.all(
      customers.map(async (c) => {
        const latestRemark = await ctx.db
          .query("remarks")
          .withIndex("by_customer", (q) => q.eq("customerId", c._id))
          .order("desc")
          .first();
        return {
          ...c,
          status: statusMap.get(c.statusId) ?? null,
          latestRemark,
        };
      }),
    );
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const customer = await ctx.db.get(id);
    if (!customer) return null;
    const status = await ctx.db.get(customer.statusId);
    return { ...customer, status };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    statusId: v.id("statuses"),
    initialRemark: v.optional(v.string()),
  },
  handler: async (ctx, { name, phone, statusId, initialRemark }) => {
    const customerId = await ctx.db.insert("customers", {
      name,
      phone,
      statusId,
    });
    const remarkText = initialRemark?.trim();
    if (remarkText) {
      await ctx.db.insert("remarks", {
        customerId,
        text: remarkText,
        statusIdAtTime: statusId,
      });
    } else {
      const status = await ctx.db.get(statusId);
      await ctx.db.insert("remarks", {
        customerId,
        text: `Customer added with status “${status?.name ?? "Unknown"}”.`,
        statusIdAtTime: statusId,
      });
    }
    return customerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { id, name, phone }) => {
    await ctx.db.patch(id, { name, phone });
  },
});

export const changeStatus = mutation({
  args: {
    id: v.id("customers"),
    statusId: v.id("statuses"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { id, statusId, note }) => {
    const customer = await ctx.db.get(id);
    if (!customer) throw new Error("Customer not found");
    const oldStatus = await ctx.db.get(customer.statusId);
    const newStatus = await ctx.db.get(statusId);
    await ctx.db.patch(id, { statusId });
    const trimmed = note?.trim();
    const text = trimmed
      ? trimmed
      : `Status changed: ${oldStatus?.name ?? "?"} → ${newStatus?.name ?? "?"}`;
    await ctx.db.insert("remarks", {
      customerId: id,
      text,
      statusIdAtTime: statusId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("by_customer", (q) => q.eq("customerId", id))
      .collect();
    for (const r of remarks) {
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(id);
  },
});

const SEED_CUSTOMERS: Array<{
  name: string;
  phone: string;
  status: string;
  remark: string;
}> = [
  {
    name: "KR Food Court",
    phone: "9645233785",
    status: "In Onboarding",
    remark: "iOS app uploaded. Paid 1000. Waiting for app release.",
  },
  {
    name: "Taqashi Mandi",
    phone: "9495643135",
    status: "In Onboarding",
    remark: "Need to ask menu type. App is new — yet to set up.",
  },
  {
    name: "Hola Brownie",
    phone: "9995045004",
    status: "App Live",
    remark: "iOS app up. Payment gateway details sent.",
  },
  {
    name: "Hotel Colombo",
    phone: "9846380654",
    status: "App Live",
    remark:
      "iOS + Android both up. iOS update needed. PG integration pending.",
  },
  {
    name: "Al Baik",
    phone: "75610 87260",
    status: "Follow-up",
    remark: "Need to call.",
  },
  {
    name: "Tree of Treats",
    phone: "87224 24567",
    status: "In Onboarding",
    remark: "Menu setup yet to start.",
  },
  {
    name: "VOX Qabile Tareef",
    phone: "99700 31110",
    status: "App Live",
    remark: "iOS app up. Android in review. Follow-up + notification pending.",
  },
  {
    name: "Bun and Scoop",
    phone: "+971 547723401",
    status: "App Live",
    remark:
      "Android + iOS both up. Need to follow up on iOS and Play Store settings.",
  },
  {
    name: "Nila",
    phone: "8943299993",
    status: "In Onboarding",
    remark: "Petpooja sent. iOS and Android: not yet.",
  },
  {
    name: "Rimaal Mandi",
    phone: "9995746633",
    status: "In Onboarding",
    remark: "Petpooja sent. iOS and Android: not yet.",
  },
  {
    name: "Pandarees",
    phone: "9746465959",
    status: "Follow-up",
    remark: "Call on April 29.",
  },
  {
    name: "Malabar Spices",
    phone: "7391 955 554",
    status: "Follow-up",
    remark: "Continuing — need to ask about app + PG integration.",
  },
  {
    name: "Chillers Meet @ 47",
    phone: "79075 45155",
    status: "No Reply",
    remark: "No reply.",
  },
  {
    name: "Shawarmax",
    phone: "9895676005",
    status: "Follow-up",
    remark: "App ready today. Need to call.",
  },
  {
    name: "Petraaz",
    phone: "0000000000",
    status: "Not Started",
    remark: "No app yet. Phone number TBD.",
  },
  {
    name: "Malabar Restaurant",
    phone: "98460 53376",
    status: "Not Started",
    remark: "Didn’t start.",
  },
  {
    name: "Rehma Restaurant",
    phone: "98957 63246",
    status: "No Reply",
    remark: "No reply.",
  },
  {
    name: "Arabian Palace",
    phone: "9746174452",
    status: "Follow-up",
    remark: "Tomorrow 12pm call.",
  },
];

export const seedCustomersIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("customers").take(1);
    if (existing.length > 0) return;

    const statuses = await ctx.db.query("statuses").collect();
    const byName = new Map(statuses.map((s) => [s.name, s]));
    const fallback = byName.get("New Lead") ?? statuses[0];
    if (!fallback) return;

    for (const c of SEED_CUSTOMERS) {
      const status = byName.get(c.status) ?? fallback;
      const customerId = await ctx.db.insert("customers", {
        name: c.name,
        phone: c.phone,
        statusId: status._id,
      });
      await ctx.db.insert("remarks", {
        customerId,
        text: c.remark,
        statusIdAtTime: status._id,
      });
    }
  },
});
