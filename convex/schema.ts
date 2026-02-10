import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Leads table
  leads: defineTable({
    // Core fields
    email: v.string(),
    companyName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    website: v.optional(v.string()),
    
    // Campaign tracking
    serviceType: v.union(v.literal("ai"), v.literal("web-design")),
    status: v.union(
      v.literal("new"),
      v.literal("email-generated"),
      v.literal("approved"),
      v.literal("sent"),
      v.literal("opened"),
      v.literal("replied"),
      v.literal("generation-failed")
    ),
    
    // Metadata from Apify (flexible JSON)
    metadata: v.optional(v.any()),
    
    // Timestamps
    uploadedAt: v.string(),
    lastContactedAt: v.optional(v.string()),
    
    // Deduplication
    uploadBatchId: v.optional(v.string()),
  })
    .index("by_email_service", ["email", "serviceType"])
    .index("by_status", ["status"])
    .index("by_service_type", ["serviceType"]),

  // Emails table
  emails: defineTable({
    leadId: v.id("leads"),
    
    // Email content
    subject: v.string(),
    body: v.string(),
    
    // Status tracking
    status: v.union(
      v.literal("pending-review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("sent"),
      v.literal("send-failed")
    ),
    
    // Timestamps
    generatedAt: v.string(),
    approvedAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    
    // Send metadata
    provider: v.optional(v.union(v.literal("gmail"), v.literal("outlook"))),
    messageId: v.optional(v.string()),
    
    // AI generation metadata
    metadata: v.optional(v.any()),
  })
    .index("by_lead", ["leadId"])
    .index("by_status", ["status"])
    .index("by_generated_at", ["generatedAt"]),

  // Email tracking table
  emailTracking: defineTable({
    emailId: v.id("emails"),
    leadId: v.id("leads"),
    messageId: v.string(),
    
    // Engagement metrics
    opened: v.boolean(),
    openedAt: v.optional(v.string()),
    clicks: v.number(),
    
    replied: v.boolean(),
    repliedAt: v.optional(v.string()),
    replyContent: v.optional(v.string()),
    
    // Bounce/spam detection
    bounced: v.optional(v.boolean()),
    markedSpam: v.optional(v.boolean()),
  })
    .index("by_email", ["emailId"])
    .index("by_lead", ["leadId"])
    .index("by_message_id", ["messageId"]),

  // Campaigns table
  campaigns: defineTable({
    name: v.string(),
    serviceType: v.union(v.literal("ai"), v.literal("web-design")),
    
    // Aggregate stats
    totalLeads: v.number(),
    emailsGenerated: v.number(),
    emailsSent: v.number(),
    emailsOpened: v.number(),
    emailsReplied: v.number(),
    
    // Calculated rates
    openRate: v.number(),
    replyRate: v.number(),
    
    // Timestamps
    createdAt: v.string(),
    lastUpdatedAt: v.string(),
  })
    .index("by_service_type", ["serviceType"])
    .index("by_created_at", ["createdAt"]),

  // Settings table
  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
