import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { httpRouter } from "convex/server";

// Action: Trigger n8n to generate emails
export const triggerEmailGeneration = action({
  args: {
    leadIds: v.array(v.id("leads")),
  },
  handler: async (ctx, args) => {
    // Get n8n webhook URL from settings
    const setting = await ctx.runQuery(api.settings.get, { 
      key: "n8n_webhook_generate_url" 
    });
    
    if (!setting || !setting.value) {
      throw new Error("n8n webhook URL not configured");
    }

    const webhookUrl = setting.value as string;

    // Get lead data
    const leads = await Promise.all(
      args.leadIds.map(id => ctx.runQuery(api.leads.get, { id }))
    );

    const validLeads = leads.filter(lead => lead !== null);

    // Prepare payload for n8n
    const payload = {
      webhookType: "generate_emails",
      leads: validLeads.map(lead => ({
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

    // Call n8n webhook
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
  handler: async (ctx, args) => {
    // Get n8n webhook URL from settings
    const setting = await ctx.runQuery(api.settings.get, { 
      key: "n8n_webhook_send_url" 
    });
    
    if (!setting || !setting.value) {
      throw new Error("n8n send webhook URL not configured");
    }

    const webhookUrl = setting.value as string;

    // Get email data
    const emails = await Promise.all(
      args.emailIds.map(id => ctx.runQuery(api.emails.get, { id }))
    );

    const validEmails = emails.filter(email => 
      email !== null && email.status === "approved"
    );

    // Get from address from settings
    const fromSetting = await ctx.runQuery(api.settings.get, { 
      key: "from_email_address" 
    });
    const fromAddress = fromSetting?.value || "you@agency.com";

    // Prepare payload for n8n
    const payload = {
      webhookType: "send_emails",
      emails: validEmails.map(email => ({
        emailId: email._id,
        leadId: email.leadId,
        to: email.lead.email,
        toName: email.lead.fullName || email.lead.firstName,
        subject: email.subject,
        body: email.body,
        fromAddress,
        provider: "gmail", // Default to gmail for now
      })),
    };

    // Call n8n webhook
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      return { success: true, emailsSent: validEmails.length };
    } catch (error) {
      console.error("Failed to trigger email sending:", error);
      throw error;
    }
  },
});

// HTTP Router for incoming n8n webhooks
const http = httpRouter();

// Webhook: Receive email generation results from n8n
http.route({
  path: "/webhook/email-generated",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    try {
      // Validate payload
      if (!body.leadId || !body.subject || !body.body) {
        return new Response("Invalid payload", { status: 400 });
      }

      // Create email record
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

// Webhook: Receive email sent confirmation from n8n
http.route({
  path: "/webhook/email-sent",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    try {
      // Validate payload
      if (!body.emailId || !body.messageId || !body.provider) {
        return new Response("Invalid payload", { status: 400 });
      }

      // Mark email as sent
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
