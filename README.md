# AI Outreach Automation Platform

A premium, real-time web application for managing AI-powered cold email outreach campaigns.

## Features

✅ **Apify CSV Auto-Import** - Upload lead exports directly, all fields auto-mapped  
✅ **Real-time Dashboard** - Live stats, charts, and activity tracking  
✅ **n8n Integration** - Trigger AI email generation and sending workflows  
✅ **Email Review System** - Approve, edit, or reject generated emails  
✅ **Analytics** - Track open rates, reply rates, and campaign performance  
✅ **Premium UI** - Dark theme with glassmorphism and smooth animations  

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Convex (real-time BaaS)
- **Styling**: Tailwind CSS + Framer Motion
- **Charts**: Recharts
- **Auth**: Convex Auth (email/password)

---

## Setup Instructions for StackBlitz

### 1. Create New StackBlitz Project

1. Go to [stackblitz.com](https://stackblitz.com)
2. Click "New Project" → "Import from GitHub" OR "Node.js" → "Vite + React + TypeScript"
3. Upload all the files from this project

### 2. Install Dependencies

In the StackBlitz terminal, run:

```bash
npm install
```

This will install all packages from `package.json`:
- React, React Router, Framer Motion
- Convex client and auth
- Recharts, Papaparse
- Tailwind CSS, Lucide icons

### 3. Set Up Convex

#### A. Create Convex Account

1. Go to [convex.dev](https://convex.dev)
2. Sign up for free account
3. Create a new project: "ai-outreach-platform"

#### B. Install Convex CLI & Initialize

In StackBlitz terminal:

```bash
# Install Convex CLI globally
npm install -g convex

# Login to Convex
npx convex login

# Initialize Convex (links your local project to cloud)
npx convex dev
```

This command will:
- Ask you to select your project
- Generate a `.env.local` file with `VITE_CONVEX_URL`
- Deploy your schema and functions
- Start watching for changes

**IMPORTANT**: Copy the `VITE_CONVEX_URL` from the output!

#### C. Configure Auth Provider

The project uses Convex Auth with Password provider. You need to add the auth dependency:

```bash
npm install @convex-dev/auth
```

Then update `package.json` to include:
```json
"dependencies": {
  "@convex-dev/auth": "^0.0.60"
}
```

### 4. Create Environment Variables

Create a `.env.local` file in the root (StackBlitz will auto-create this after `npx convex dev`):

```env
VITE_CONVEX_URL=https://your-deployment-name.convex.cloud
```

### 5. Run the Application

In one terminal, keep Convex running:
```bash
npx convex dev
```

In another terminal (or StackBlitz will auto-run), start Vite:
```bash
npm run dev
```

The app should now be running! StackBlitz will show you a preview URL.

---

## First-Time Usage

### 1. Create Account

1. Open the app in your browser
2. Click "Sign Up"
3. Enter email + password (min 8 chars)
4. You'll be auto-logged in

### 2. Configure n8n Webhooks

1. Go to **Settings** page
2. Enter your n8n webhook URLs:
   - **Email Generation URL**: Your n8n workflow that receives lead data and generates emails
   - **Email Sending URL**: Your n8n workflow that sends emails via Gmail/Outlook
3. Set your **From Email Address** (your agency email)
4. Click "Save Settings"

### 3. Upload Leads

1. Go to **Leads** page
2. Click "Upload Leads"
3. Select service type (AI or Web Design)
4. Upload your Apify CSV export
5. All fields will be auto-mapped - no preprocessing needed!

### 4. Generate Emails

1. Select leads from the table (checkboxes)
2. Click "Generate Emails (X)"
3. This triggers your n8n workflow
4. Generated emails appear in **Email Review** page

### 5. Review & Approve

1. Go to **Email Review** page
2. Click on a pending email to preview
3. Edit subject/body if needed
4. Click "Approve" or "Reject"

### 6. Send Emails

1. In **Email Review**, switch to "Approved" tab
2. Click "Send All"
3. This triggers your n8n sending workflow
4. Track open/reply rates in **Analytics**

---

## n8n Workflow Configuration

### Workflow 1: Email Generation

**Trigger**: Webhook (POST)

**Example Payload YOU'LL RECEIVE**:
```json
{
  "webhookType": "generate_emails",
  "leads": [
    {
      "leadId": "j9x7k2l4m5n6",
      "email": "john@acme.com",
      "companyName": "Acme Corp",
      "firstName": "John",
      "website": "acme.com",
      "serviceType": "ai",
      "metadata": {
        "jobTitle": "VP Engineering",
        "technologies": "React, Python",
        "companySize": "50-200"
      }
    }
  ]
}
```

**What Your n8n Workflow Should Do**:
1. Receive webhook
2. For each lead:
   - Scrape their website (optional)
   - Send to Claude/GPT to generate personalized email
3. Send results BACK to Convex webhook

**Example Response TO SEND BACK** (POST to Convex webhook):
```json
{
  "leadId": "j9x7k2l4m5n6",
  "subject": "AI Automation for Acme Corp",
  "body": "Hi John,\n\nI noticed Acme...",
  "metadata": {
    "model": "claude-sonnet-4",
    "tokensUsed": 847
  }
}
```

**Convex Callback URL** (from Settings page):
```
https://your-deployment.convex.site/webhook/email-generated
```

---

### Workflow 2: Email Sending

**Trigger**: Webhook (POST)

**Example Payload YOU'LL RECEIVE**:
```json
{
  "webhookType": "send_emails",
  "emails": [
    {
      "emailId": "k8m9n0p1q2r3",
      "to": "john@acme.com",
      "subject": "...",
      "body": "...",
      "fromAddress": "you@agency.com",
      "provider": "gmail"
    }
  ]
}
```

**What Your n8n Workflow Should Do**:
1. Receive webhook
2. Send email via Gmail/Outlook API
3. Get messageId from provider
4. Send confirmation BACK to Convex

**Example Response TO SEND BACK**:
```json
{
  "emailId": "k8m9n0p1q2r3",
  "status": "sent",
  "sentAt": "2026-02-10T16:45:00Z",
  "messageId": "<CAGp...@mail.gmail.com>",
  "provider": "gmail"
}
```

**Convex Callback URL**:
```
https://your-deployment.convex.site/webhook/email-sent
```

---

## Project Structure

```
ai-outreach-platform/
├── convex/                  # Backend functions
│   ├── schema.ts           # Database schema
│   ├── auth.ts             # Authentication
│   ├── leads.ts            # Lead queries/mutations
│   ├── emails.ts           # Email queries/mutations
│   ├── http.ts             # n8n webhook endpoints
│   └── settings.ts         # Settings CRUD
│
├── src/
│   ├── components/
│   │   └── Layout.tsx      # Main layout with sidebar
│   ├── pages/
│   │   ├── SignIn.tsx      # Auth page
│   │   ├── Dashboard.tsx   # Overview stats
│   │   ├── Leads.tsx       # Lead management
│   │   ├── EmailReview.tsx # Email approval
│   │   ├── Analytics.tsx   # Charts & metrics
│   │   └── Settings.tsx    # Configuration
│   ├── App.tsx             # Router
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind + custom styles
│
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind theme
├── vite.config.ts          # Vite config
└── convex.json             # Convex config
```

---

## Apify CSV Field Mapping

The system automatically maps these Apify fields:

**Core Fields** (required):
- `email` or `personal_email` → email
- `company_name` → companyName

**Name Fields** (optional):
- `first_name`, `last_name`, `full_name` → firstName, lastName, fullName

**Company Fields** (optional):
- `company_website`, `company_domain` → website
- `company_linkedin` → metadata.linkedin
- `company_description` → metadata.description
- `industry` → metadata.industry
- `company_technologies` → metadata.technologies
- `company_size` → metadata.companySize

**Location Fields**:
- `company_city`, `city`, `state`, `country` → metadata.location

**Job Fields**:
- `job_title`, `headline` → metadata.jobTitle
- `seniority_level` → metadata.seniority

**All other fields** are preserved in `metadata.raw` for AI context!

---

## Keyboard Shortcuts

### Email Review Page
- `J` / `K` - Navigate email list
- `Enter` - Open selected email
- `Cmd/Ctrl + Enter` - Approve email
- `Cmd/Ctrl + R` - Regenerate email
- `Esc` - Close editor

---

## Troubleshooting

### "Convex functions not found"
- Make sure `npx convex dev` is running
- Check `.env.local` has correct `VITE_CONVEX_URL`
- Restart Vite dev server

### "CSV upload fails"
- Ensure CSV has `email` and `company_name` columns
- Check browser console for parsing errors
- Try with smaller test file first

### "n8n webhooks not triggering"
- Verify webhook URLs in Settings page
- Check n8n workflow is activated
- Look for errors in n8n execution logs

### "Emails not appearing after generation"
- Check n8n workflow is sending data BACK to Convex callback URL
- Verify payload matches expected format
- Check Convex logs in dashboard

---

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variable: `VITE_CONVEX_URL`
4. Deploy!

### Backend (Convex)

```bash
npx convex deploy
```

This deploys your Convex functions to production.

---

## Support

For issues or questions:
1. Check the spec doc: `AI-Outreach-Platform-Specification.md`
2. Review Convex docs: [docs.convex.dev](https://docs.convex.dev)
3. Review n8n docs: [docs.n8n.io](https://docs.n8n.io)

---

## License

Private use only.
