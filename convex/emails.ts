import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Query: Get emails with optional filters
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending-review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("sent"),
      v.literal("send-failed")
    )),
    leadId: v.optional(v.id("leads")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    let emails = await ctx.db.query("emails").collect();

    // Apply filters
    if (args.status) {
      emails = emails.filter(e => e.status === args.status);
    }
    if (args.leadId) {
      emails = emails.filter(e => e.leadId === args.leadId);
    }

    // Get lead data for each email
    const emailsWithLeads = await Promise.all(
      emails.map(async (email) => {
        const lead = await ctx.db.get(email.leadId);
        return { ...email, lead };
      })
    );

    // Sort by most recent first
    return emailsWithLeads.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  },
});

// Query: Get single email by ID
export const get = query({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    const email = await ctx.db.get(args.id);
    if (!email) return null;

    const lead = await ctx.db.get(email.leadId);
    return { ...email, lead };
  },
});

// Mutation: Create email (called by n8n webhook)
export const create = mutation({
  args: {
    leadId: v.id("leads"),
    subject: v.string(),
    body: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const emailId = await ctx.db.insert("emails", {
      leadId: args.leadId,
      subject: args.subject,
      body: args.body,
      status: "pending-review",
      generatedAt: new Date().toISOString(),
      metadata: args.metadata,
    });

    // Update lead status
    await ctx.db.patch(args.leadId, {
      status: "email-generated",
    });

    return emailId;
  },
});

// Mutation: Update email content
export const update = mutation({
  args: {
    id: v.id("emails"),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const updates: any = {};
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.body !== undefined) updates.body = args.body;

    await ctx.db.patch(args.id, updates);
  },
});

// Mutation: Approve email
export const approve = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const email = await ctx.db.get(args.id);
    if (!email) throw new Error("Email not found");

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: new Date().toISOString(),
    });

    // Update lead status
    await ctx.db.patch(email.leadId, {
      status: "approved",
    });
  },
});

// Mutation: Reject email
export const reject = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      status: "rejected",
    });
  },
});

// Mutation: Mark as sent (called by n8n webhook)
export const markSent = mutation({
  args: {
    id: v.id("emails"),
    messageId: v.string(),
    provider: v.union(v.literal("gmail"), v.literal("outlook")),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.id);
    if (!email) throw new Error("Email not found");

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
      messageId: args.messageId,
      provider: args.provider,
    });

    // Update lead status
    await ctx.db.patch(email.leadId, {
      status: "sent",
      lastContactedAt: new Date().toISOString(),
    });

    // Create tracking record
    await ctx.db.insert("emailTracking", {
      emailId: args.id,
      leadId: email.leadId,
      messageId: args.messageId,
      opened: false,
      replied: false,
      clicks: 0,
    });
  },
});

// Mutation: Bulk approve
export const bulkApprove = mutation({
  args: { ids: v.array(v.id("emails")) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    for (const id of args.ids) {
      const email = await ctx.db.get(id);
      if (!email) continue;

      await ctx.db.patch(id, {
        status: "approved",
        approvedAt: new Date().toISOString(),
      });

      await ctx.db.patch(email.leadId, {
        status: "approved",
      });
    }
  },
});
