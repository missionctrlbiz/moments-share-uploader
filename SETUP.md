# Setup Guide — Moments by Bibi

A complete, step-by-step guide to set up Moments from scratch. Every click, every field, every decision explained.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup (Drive API)](#google-cloud-setup)
3. [Resend Setup (Email Notifications)](#resend-setup)
4. [Vercel KV Setup (Database)](#vercel-kv-setup)
5. [Environment Variables](#environment-variables)
6. [Local Development](#local-development)
7. [Deployment to Vercel](#deployment-to-vercel)
8. [CI/CD with GitHub Actions](#cicd-with-github-actions)
9. [Cost Breakdown](#cost-breakdown)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

You need accounts on these platforms (all free):

| Platform | Why | Sign Up |
|----------|-----|---------|
| **GitHub** | Code hosting + CI/CD | [github.com](https://github.com) |
| **Vercel** | Hosting + KV database | [vercel.com](https://vercel.com) |
| **Google Cloud** | Google Drive API access | [console.cloud.google.com](https://console.cloud.google.com) |
| **Resend** | Email notifications | [resend.com](https://resend.com) |

---

## Google Cloud Setup

This is the most involved part. Follow each step exactly.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top (next to "Google Cloud")
3. Click **"New Project"**
4. Name it: `moments-share` (or anything you like)
5. Click **"Create"**
6. Wait for it to finish, then select the new project from the dropdown

**Cost: $0.** Google Cloud free tier covers everything we need.

### Step 2: Enable the Google Drive API

1. In the left sidebar, go to **"APIs & Services" > "Library"**
2. Search for **"Google Drive API"**
3. Click on it
4. Click **"Enable"**
5. Wait for it to enable (takes ~30 seconds)

### Step 3: Create a Service Account

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"Service account"**
4. Fill in:
   - **Service account name:** `moments-uploader`
   - **Service account ID:** `moments-uploader` (auto-fills)
   - **Description:** `Uploads files to Google Drive for Moments app`
5. Click **"Create and Continue"**
6. **Role:** Select **"Project" > "Editor"** (allows reading/writing files)
7. Click **"Continue"**
8. Click **"Done"**

### Step 4: Generate a Service Account Key

1. In the Credentials page, find the service account you just created
2. Click on it to open its details
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"**
6. Click **"Create"**
7. A JSON file downloads to your computer — **keep this safe!**

### Step 5: Extract Your Credentials

Open the downloaded JSON file. You need two values:

```json
{
  "client_email": "moments-uploader@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
}
```

- **`GOOGLE_CLIENT_EMAIL`** = the `client_email` value
- **`GOOGLE_PRIVATE_KEY`** = the `private_key` value (keep the `\n` characters!)

### Step 6: Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called **"Moments"** (or whatever you like)
3. Open the folder
4. Look at the URL: `https://drive.google.com/drive/folders/1ABC123xyz...`
5. Copy the folder ID from the URL (the part after `/folders/`)
6. This is your **`GOOGLE_DRIVE_FOLDER_ID`**

### Step 7: Share the Folder with the Service Account

**This is critical!** The service account can't access your personal Drive by default.

1. Right-click the **"Moments"** folder in Google Drive
2. Click **"Share"**
3. In the email field, paste your service account email (`moments-uploader@your-project.iam.gserviceaccount.com`)
4. Set permission to **"Editor"**
5. Click **"Send"**

**Without this step, uploads will fail with a 403 error.**

### Step 8: (Optional) Verify It Works

Test with this curl command (replace values):

```bash
# Install googleapis if you haven't
npm install googleapis

# Quick test script
node -e "
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'YOUR_CLIENT_EMAIL',
    private_key: 'YOUR_PRIVATE_KEY'
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({version: 'v3', auth});
drive.files.list({q: \"'YOUR_FOLDER_ID' in parents\", pageSize: 1})
  .then(r => console.log('Success:', r.data.files))
  .catch(e => console.error('Error:', e.message));
"
```

---

## Resend Setup

Resend handles email notifications. Their free tier gives you 100 emails/day — more than enough.

### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

**Cost: $0.** Free tier: 100 emails/day, 3,000/month.

### Step 2: Get Your API Key

1. In the Resend dashboard, go to **"API Keys"** (left sidebar)
2. Click **"Create API Key"**
3. Name it: `moments-notifications`
4. Click **"Add"**
5. Copy the key immediately — it starts with `re_`
6. This is your **`RESEND_API_KEY`**

### Step 3: Set Your Notification Email

This is where upload notifications get sent — your personal email.

- **`NOTIFICATION_EMAIL`** = `your-email@gmail.com`

### Step 4: Understanding the Sender Email

By default, Resend uses `onboarding@resend.dev` as the sender. This works for testing but:

- Emails come from `onboarding@resend.dev` (not your domain)
- Some email providers may mark it as spam
- **For production**, you'd verify your own domain in Resend

For personal use, the default sender works fine. If you want a custom sender:

1. In Resend, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `bibi.dev`)
4. Add the DNS records Resend gives you (MX, TXT, CNAME)
5. Wait for verification (~5 minutes)
6. Update `FROM_EMAIL` to `Moments <notifications@bibi.dev>`

**This step is optional.** The default sender works for getting started.

### What the Emails Look Like

When someone uploads a file, you get a beautifully designed HTML email:

```
📸 New Upload!

From: John Smith
Type: Photo
Files: IMG_2024.jpg, IMG_2025.jpg
Message: "Great meeting you today!"

May 29, 2026 at 3:45 PM
```

---

## Vercel KV Setup

Vercel KV stores upload metadata and powers the real-time dashboard. It's Redis, managed by Vercel.

### Step 1: Connect KV to Your Vercel Project

**After deploying to Vercel** (see Deployment section):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Connect KV (this creates the database automatically)
npx vercel kv connect
```

This automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your Vercel environment variables.

### Step 2: What KV Stores

| Key Pattern | Type | Contents |
|-------------|------|----------|
| `upload:{id}` | Hash | Full upload metadata (sender, files, message, timestamps) |
| `uploads:list` | List | Upload IDs in reverse chronological order |
| `stats:cache` | String (JSON) | Cached dashboard stats (expires every 60s) |

### Step 3: Free Tier Limits

- **30,000 commands/day** — more than enough for personal use
- **256 MB storage** — metadata is tiny (~500 bytes per upload)
- **No cold starts** — always warm on Vercel

**Cost: $0.** You'd need ~300 uploads/day to hit the free limit.

---

## Environment Variables

Create a `.env.local` file in your project root:

```bash
# Google Drive
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=1ABC123xyzYourFolderId

# Email (Resend)
RESEND_API_KEY=re_abc123yourapikey
NOTIFICATION_EMAIL=your-email@gmail.com
FROM_EMAIL=Moments <onboarding@resend.dev>

# Vercel KV (auto-configured after `npx vercel kv connect`)
# KV_REST_API_URL=https://your-kv.vercel-storage.com
# KV_REST_API_TOKEN=your-token

# Admin (optional, for future use)
ADMIN_PASSWORD=your-password
```

### Variable Details

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_EMAIL` | Yes | Service account email from JSON key file |
| `GOOGLE_PRIVATE_KEY` | Yes | Full private key with `\n` characters |
| `GOOGLE_DRIVE_FOLDER_ID` | Yes | ID of the root folder in your Google Drive |
| `RESEND_API_KEY` | Yes | Resend API key starting with `re_` |
| `NOTIFICATION_EMAIL` | Yes | Your email for receiving notifications |
| `FROM_EMAIL` | No | Sender address (default: `onboarding@resend.dev`) |
| `KV_REST_API_URL` | Auto | Set by `vercel kv connect` |
| `KV_REST_API_TOKEN` | Auto | Set by `vercel kv connect` |
| `ADMIN_PASSWORD` | No | For future admin authentication |

---

## Local Development

### First Time Setup

```bash
# Clone
git clone https://github.com/bibi/moments-share-uploader.git
cd moments-share-uploader

# Install
npm install

# Environment
cp .env.example .env.local
# Edit .env.local with your values

# Run
npm run dev
```

### Available Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server at `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check |

### Local Development Notes

- **Google Drive** works locally — files upload to your real Drive
- **Resend** sends real emails to your real inbox
- **Vercel KV** requires the Vercel environment — locally, KV operations fail silently (upload still works, just no metadata)
- **Sounds** generate programmatically — no audio files needed
- **Three.js** renders in the browser — needs WebGL support

---

## Deployment to Vercel

### Option A: Git Integration (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/bibi/moments-share-uploader.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel auto-detects Next.js — click **"Deploy"**
5. After deployment, go to **Settings > Environment Variables** and add all variables from `.env.local`

### Option B: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment

1. **Connect KV:**
   ```bash
   npx vercel kv connect
   ```

2. **Test the sharing page:** Visit your Vercel URL
3. **Test the admin:** Visit `{your-url}/admin`
4. **Share the link:** Send your URL to someone and have them upload a test file

---

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request.

### What the CI Pipeline Does

```
Push to GitHub
    │
    ▼
┌─────────────┐
│  Lint Code   │  ESLint checks for code quality
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Type Check   │  TypeScript compiler checks
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Build     │  Next.js production build
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy     │  Auto-deploy to Vercel (main branch only)
└─────────────┘
```

### How It Works

1. **On every push/PR:** Lint + Type Check + Build run
2. **On push to `main`:** Also auto-deploys to Vercel production
3. **On PR:** Creates a Vercel preview deployment (commented on the PR)

### Required Secrets

Add these in GitHub: **Settings > Secrets and variables > Actions**

| Secret | Where to find |
|--------|---------------|
| `VERCEL_TOKEN` | Vercel dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Run `vercel link` locally, check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same as above |

### Workflow File Location

```
.github/workflows/ci.yml
```

### Customizing the Pipeline

To skip CI for a commit:
```bash
git commit -m "chore: skip CI" --no-verify
```

To manually trigger deployment:
```bash
vercel --prod
```

---

## Cost Breakdown

### Free Tier Summary

| Service | Free Tier | Your Usage (Est.) | Cost |
|---------|-----------|-------------------|------|
| **Vercel** | 100GB bandwidth, 1000 builds/mo | ~1GB, ~50 builds | **$0** |
| **Vercel KV** | 30K commands/day | ~200 commands/day | **$0** |
| **Google Drive** | 15GB storage | ~1GB for photos | **$0** |
| **Resend** | 100 emails/day | ~5-10 emails/day | **$0** |
| **Google Cloud** | $300 free credit | ~$0 usage | **$0** |
| **GitHub** | Unlimited repos | 1 private repo | **$0** |

### **Total: $0/month**

You'd have to be extremely popular to exceed these free tiers:
- **300+ uploads/day** to hit KV limits
- **100+ emails/day** to hit Resend limits
- **100GB+/month** traffic to hit Vercel bandwidth

### When You'd Pay

| Threshold | Service | Cost |
|-----------|---------|------|
| >30K KV commands/day | Vercel KV | $10/mo per 100K commands |
| >100 emails/day | Resend | $20/mo for 50K emails |
| >100GB bandwidth | Vercel | $20/mo per 100GB |
| >15GB Drive storage | Google One | $2/mo for 100GB |

**For personal use, you'll likely never pay a cent.**

---

## Troubleshooting

### "Google Drive: File not found" or 403 Error

**Cause:** Service account doesn't have access to the folder.

**Fix:** Share the Google Drive folder with your service account email (Step 7 in Google Cloud Setup).

### "Resend: API key invalid"

**Cause:** Wrong API key or key was revoked.

**Fix:** Generate a new key in Resend dashboard > API Keys.

### "KV: Connection refused" (local development)

**Cause:** Vercel KV only works in Vercel's environment.

**Fix:** This is expected. Locally, uploads still work — metadata just won't persist. Deploy to Vercel for full functionality.

### "Build failed: Module not found"

**Cause:** Dependencies not installed.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Sound effects not playing

**Cause:** Browser blocked autoplay.

**Fix:** Sounds only play after user interaction (click/tap). This is a browser policy — can't be bypassed.

### Confetti not showing

**Cause:** canvas-confetti requires canvas support.

**Fix:** Ensure you're using a modern browser. Confetti works on all modern browsers.

### Emails going to spam

**Cause:** Using default Resend sender (`onboarding@resend.dev`).

**Fix:** Verify your own domain in Resend (see Resend Setup > Step 4).

---

## Next Steps

After deployment:

1. **Test the full flow** — Open your URL, upload a file, check email, check admin
2. **Share the link** — Send it to a friend and have them test
3. **Add personal photos** — Customize the Three.js background or add branding
4. **Monitor uploads** — Check the admin dashboard regularly
5. **Customize sounds** — Replace programmatic sounds with custom audio files if desired

---

## Support

If you get stuck:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [GitHub Issues](https://github.com/bibi/moments-share-uploader/issues)
3. Open a new issue with error details

---

**Built with love by Bibi.**
