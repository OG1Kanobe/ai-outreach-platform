# 🚀 QUICK START GUIDE - StackBlitz Setup

## Step 1: Import to StackBlitz (2 mins)

1. Go to **stackblitz.com**
2. Click **"New Project"** → **"Import from GitHub"**
3. OR: Create **"Vite + React + TypeScript"** project and upload all files

---

## Step 2: Install Dependencies (1 min)

Open StackBlitz terminal and run:

```bash
npm install
```

Wait for all packages to install (~30 seconds).

---

## Step 3: Set Up Convex (5 mins)

### A. Create Convex Account

1. Go to [convex.dev](https://convex.dev)
2. Sign up (free)
3. Create project: **"ai-outreach-platform"**

### B. Initialize Convex

In StackBlitz terminal:

```bash
# Install Convex globally
npm install -g convex

# Login
npx convex login

# Initialize (this links your project)
npx convex dev
```

**IMPORTANT**: This will:
- Ask you to select your project
- Auto-create `.env.local` with your Convex URL
- Deploy your backend schema & functions
- Start watching for changes

### C. Add Auth Package

```bash
npm install @convex-dev/auth
```

---

## Step 4: Run the App (1 min)

StackBlitz should auto-start the dev server. If not:

```bash
npm run dev
```

**KEEP `npx convex dev` RUNNING** in the terminal!

You should see the app at the StackBlitz preview URL.

---

## Step 5: Create Your Account (30 seconds)

1. App loads → Sign Up page
2. Enter email + password
3. Click "Create Account"
4. You're in! 🎉

---

## Step 6: Configure n8n (Optional - do later)

1. Go to **Settings** page
2. Enter your n8n webhook URLs (when you create them)
3. Set your from email
4. Click "Save"

---

## Step 7: Upload Test Leads (1 min)

1. Go to **Leads** page
2. Click **"Upload Leads"**
3. Select service type
4. Upload your Apify CSV
5. Watch leads appear in real-time!

---

## ✅ You're Done!

Your MVP is now running. Here's what you can do:

- ✅ Upload Apify CSV exports (auto-mapped!)
- ✅ View leads in table
- ✅ See dashboard stats
- ⏳ Configure n8n for email generation (next step)
- ⏳ Configure n8n for email sending (next step)

---

## Next Steps: n8n Integration

See `README.md` for full n8n webhook setup instructions.

**Short version**:

1. **Create n8n workflow** that receives lead data
2. **Generate emails** with Claude/GPT
3. **Send results back** to Convex webhook URL (shown in Settings)

Convex webhook URLs (copy from Settings page):
- Email Generated: `https://your-deployment.convex.site/webhook/email-generated`
- Email Sent: `https://your-deployment.convex.site/webhook/email-sent`

---

## Troubleshooting

**"Functions not found"**
→ Make sure `npx convex dev` is running

**"No VITE_CONVEX_URL"**
→ Check `.env.local` exists and has your URL

**"CSV upload fails"**
→ Ensure CSV has `email` and `company_name` columns

**Need help?**
→ Read full `README.md` or check spec doc

---

## 🎯 2-Day Plan

### Day 1: Get MVP Running
- ✅ Import to StackBlitz (done)
- ✅ Set up Convex (done)
- ✅ Test CSV upload
- 🔧 Create n8n email generation workflow
- 🔧 Test end-to-end: Upload → Generate → Review

### Day 2: Email Sending
- 🔧 Set up Gmail/Outlook API in n8n
- 🔧 Create n8n email sending workflow
- 🔧 Test: Approve → Send → Track
- 🎉 Start using for real outreach!

---

**You've got this! Your MVP is ready to use. 🚀**
