import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Query: Get all leads with optional filters
export const list = query({
  args: {
    serviceType: v.optional(v.union(v.literal("ai"), v.literal("web-design"))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    let leads = await ctx.db.query("leads").collect();

    // Apply filters
    if (args.serviceType) {
      leads = leads.filter(lead => lead.serviceType === args.serviceType);
    }
    if (args.status) {
      leads = leads.filter(lead => lead.status === args.status);
    }

    // Sort by most recent first
    return leads.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  },
});

// Query: Get single lead by ID
export const get = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(args.id);
  },
});

// Query: Get analytics stats
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const leads = await ctx.db.query("leads").collect();
    const emails = await ctx.db.query("emails").collect();
    const tracking = await ctx.db.query("emailTracking").collect();

    const sentEmails = emails.filter(e => e.status === "sent");
    const openedEmails = tracking.filter(t => t.opened);
    const repliedEmails = tracking.filter(t => t.replied);

    return {
      totalLeads: leads.length,
      emailsSent: sentEmails.length,
      openRate: sentEmails.length > 0 ? (openedEmails.length / sentEmails.length) * 100 : 0,
      replyRate: sentEmails.length > 0 ? (repliedEmails.length / sentEmails.length) * 100 : 0,
      
      // Breakdown by service type
      ai: {
        leads: leads.filter(l => l.serviceType === "ai").length,
        sent: emails.filter(e => e.status === "sent" && 
          leads.find(l => l._id === e.leadId)?.serviceType === "ai").length,
      },
      webDesign: {
        leads: leads.filter(l => l.serviceType === "web-design").length,
        sent: emails.filter(e => e.status === "sent" && 
          leads.find(l => l._id === e.leadId)?.serviceType === "web-design").length,
      },
    };
  },
});

// Mutation: Upload leads from CSV
export const upload = mutation({
  args: {
    leads: v.array(v.object({
      email: v.string(),
      companyName: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      website: v.optional(v.string()),
      serviceType: v.union(v.literal("ai"), v.literal("web-design")),
      metadata: v.optional(v.any()),
    })),
    uploadBatchId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const results = {
      inserted: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    for (const lead of args.leads) {
      try {
        // Check for duplicates
        const existing = await ctx.db
          .query("leads")
          .withIndex("by_email_service", (q) => 
            q.eq("email", lead.email).eq("serviceType", lead.serviceType)
          )
          .first();

        if (existing) {
          results.duplicates++;
          continue;
        }

        // Insert new lead
        await ctx.db.insert("leads", {
          ...lead,
          status: "new",
          uploadedAt: new Date().toISOString(),
          uploadBatchId: args.uploadBatchId,
        });

        results.inserted++;
      } catch (error) {
        results.errors.push(`Failed to insert ${lead.email}: ${error}`);
      }
    }

    return results;
  },
});

// Mutation: Update lead status
export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    status: v.union(
      v.literal("new"),
      v.literal("email-generated"),
      v.literal("approved"),
      v.literal("sent"),
      v.literal("opened"),
      v.literal("replied"),
      v.literal("generation-failed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Mutation: Delete lead
export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

// Mutation: Bulk delete
export const bulkDelete = mutation({
  args: { ids: v.array(v.id("leads")) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});
