import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { httpRouter } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import { auth } from "./auth";

/**
 * TYPES & INTERFACES
 * Explicitly defining these breaks the circular inference loop
 */
interface EmailWithLead {
  email: Doc<"emails">;
  lead: Doc<"leads">;
}

// --- ACTIONS ---

// Action: Trigger n8n to generate emails
export const triggerEmailGeneration = action({
  args: {
    leadIds: v.array(v.id("leads")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; leadsProcessed: number }> => {
    const setting = await ctx.runQuery(api.settings.get, { 
      key: "n8n_webhook_generate_url" 
    });
    
    if (!setting || !setting.value) {
      throw new Error("n8n webhook URL not configured");
    }

    const webhookUrl = setting.value as string;

    // Get lead data with explicit typing
    const leads: (Doc<"leads"> | null)[] = await Promise.all(
      args.leadIds.map((id: Id<"leads">) => ctx.runQuery(api.leads.get, { id }))
    );

    const validLeads: Doc<"leads">[] = leads.filter(
      (lead): lead is Doc<"leads"> => lead !== null
    );

    const payload = {
      webhookType: "generate_emails",
      leads: validLeads.map((lead: Doc<"leads">) => ({
        leadId: lead._id,
        email: lead.email,
        companyName: lead.companyName,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: lead.fullName,
        website: lead.website,
        serviceType: lead.serviceType,
        metadata: lead.metadata,
      })),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      return { success: true, leadsProcessed: validLeads.length };
    } catch (error) {
      console.error("Failed to trigger n8n:", error);
      throw error;
    }
  },
});

// Action: Trigger n8n to send emails
export const triggerEmailSending = action({
  args: {
    emailIds: v.array(v.id("emails")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; emailsSent: number }> => {
    const setting = await ctx.runQuery(api.settings.get, { 
      key: "n8n_webhook_send_url" 
    });
    
    if (!setting || !setting.value) {
      throw new Error("n8n send webhook URL not configured");
    }

    const webhookUrl = setting.value as string;

    // Get email data
    const emails: (Doc<"emails"> | null)[] = await Promise.all(
      args.emailIds.map((id: Id<"emails">) => ctx.runQuery(api.emails.get, { id }))
    );

    const validEmails: Doc<"emails">[] = emails.filter((email): email is Doc<"emails"> => 
      email !== null && email.status === "approved"
    );

    const fromSetting = await ctx.runQuery(api.settings.get, { 
      key: "from_email_address" 
    });
    const fromAddress: string = (fromSetting?.value as string) || "you@agency.com";

    // Join Leads to Emails (Convex doesn't do this automatically in actions)
    const emailsWithLeads: (EmailWithLead | null)[] = await Promise.all(
      validEmails.map(async (email: Doc<"emails">) => {
        const lead = await ctx.runQuery(api.leads.get, { id: email.leadId });
        if (!lead) return null;
        return { email, lead };
      })
    );

    const activePairs: EmailWithLead[] = emailsWithLeads.filter(
      (pair): pair is EmailWithLead => pair !== null
    );

    const payload = {
      webhookType: "send_emails",
      emails: activePairs.map(({ email, lead }: EmailWithLead) => ({
        emailId: email._id,
        leadId: email.leadId,
        to: lead.email,
        toName: lead.fullName || lead.firstName,
        subject: email.subject,
        body: email.body,
        fromAddress,
        provider: "gmail",
      })),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      return { success: true, emailsSent: activePairs.length };
    } catch (error) {
      console.error("Failed to trigger email sending:", error);
      throw error;
    }
  },
});

// --- HTTP ROUTER ---

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/webhook/email-generated",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    try {
      if (!body.leadId || !body.subject || !body.body) {
        return new Response("Invalid payload", { status: 400 });
      }

      await ctx.runMutation(internal.emails.create, {
        leadId: body.leadId,
        subject: body.subject,
        body: body.body,
        metadata: body.metadata,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/webhook/email-sent",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    try {
      if (!body.emailId || !body.messageId || !body.provider) {
        return new Response("Invalid payload", { status: 400 });
      }

      await ctx.runMutation(internal.emails.markSent, {
        id: body.emailId,
        messageId: body.messageId,
        provider: body.provider,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;