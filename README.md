<div align="center">

# Moments by Bibi

**A beautiful way to share photos, videos, and memories.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/missionctrlbiz/moments-share-uploader)

[Live Demo](https://moments-share-uploader.vercel.app) · [Admin Dashboard](https://moments-share-uploader.vercel.app/admin) · [Setup Guide](./SETUP.md)

</div>

---

## What is Moments?

Moments is a personal file-sharing app. Share a URL with anyone — friends, strangers at events, anyone who takes your picture — and they can send you photos, videos, links, or files directly to your Google Drive. No app install, no account needed. Just open the link and share.

### Key Features

- **Public Sharing Page** — A gorgeous Three.js animated landing page with dynamic welcome messages
- **Step-by-Step Form** — Guided 4-step flow: choose type, upload content, add optional contact info, confirm
- **Instant Notifications** — Email alerts via Resend every time someone shares something
- **Google Drive Backend** — Files automatically organized into date/type folders in your Drive
- **Admin Dashboard** — Rich monitoring panel with real-time upload stats, file browser, and image enhance tools
- **Vercel KV** — Metadata storage for real-time dashboard updates and upload analytics
- **Sound Effects** — 10 programmatic sound effects (no audio files needed) via Web Audio API + Howler.js
- **Confetti Celebration** — Canvas confetti burst on successful upload
- **Mobile-First** — Fully responsive, optimized for phone usage
- **Dark Mode** — Automatic dark/light mode based on system preference

---

## Live Deployment

| URL | Purpose |
|-----|---------|
| [moments-share-uploader.vercel.app](https://moments-share-uploader.vercel.app) | Public sharing page |
| [moments-share-uploader.vercel.app/admin](https://moments-share-uploader.vercel.app/admin) | Admin dashboard |
| [GitHub Repo](https://github.com/missionctrlbiz/moments-share-uploader) | Source code |

### Custom Domain (Optional)

The app supports any custom domain. To set up a free `.is-a.dev` domain (e.g., `moments.is-a.dev`), see the [Custom Domain Setup](#custom-domain-setup-is-a-dev) section below.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Share Form   │  │   Three.js   │  │    Sounds    │  │
│  │  (4-step)     │  │  Background  │  │  (Web Audio) │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│  ┌──────┴───────┐  ┌──────────────┐                     │
│  │   Confetti   │  │  Framer      │                     │
│  │   (canvas)   │  │  Motion      │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────┬───────────────────────────────────┘
                      │ POST /api/upload
                      │ GET  /api/files
┌─────────────────────┴───────────────────────────────────┐
│                    NEXT.JS SERVER                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  API Routes                        │   │
│  │                                                    │   │
│  │  /api/upload  →  Upload files + save metadata     │   │
│  │  /api/files   →  Fetch uploads + dashboard stats  │   │
│  └──────────┬──────────────────┬────────────────────┘   │
│             │                  │                         │
│  ┌──────────▼──────────┐  ┌───▼──────────────────┐     │
│  │    Google Drive      │  │     Vercel KV         │     │
│  │    (File Storage)    │  │     (Metadata)        │     │
│  │                      │  │                       │     │
│  │  - Date folders      │  │  - Upload records     │     │
│  │  - Type subfolders   │  │  - Dashboard stats    │     │
│  │  - File hosting      │  │  - View tracking      │     │
│  └──────────────────────┘  └───────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Resend (Email)                        │   │
│  │  - Upload notifications                           │   │
│  │  - Rich HTML email templates                      │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| 3D Graphics | Three.js via @react-three/fiber + @react-three/drei |
| Animations | Framer Motion |
| Confetti | canvas-confetti |
| Sounds | Web Audio API + Howler.js (programmatic, zero files) |
| Icons | Lucide React |
| File Storage | Google Drive API |
| Metadata DB | Vercel KV (Redis) |
| Email | Resend |
| Fonts | Plus Jakarta Sans + Inter |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Project Structure

```
moments-share-uploader/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Public sharing page
│   │   ├── layout.tsx            # Root layout with fonts
│   │   ├── globals.css           # Global styles + CSS variables
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── api/
│   │       ├── upload/route.ts   # File upload endpoint
│   │       └── files/route.ts    # Metadata query endpoint
│   ├── components/
│   │   ├── ShareForm.tsx         # Multi-step sharing form
│   │   └── ThreeBackground.tsx   # Three.js animated background
│   └── lib/
│       ├── utils.ts              # Utilities, constants, formatters
│       ├── google-drive.ts       # Google Drive API integration
│       ├── kv.ts                 # Vercel KV database operations
│       ├── db-schema.ts          # TypeScript types for metadata
│       ├── notifications.ts      # Resend email notifications
│       └── sounds.ts             # Web Audio + Howler sound engine
├── public/
│   └── sounds/                   # (optional) custom sound files
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD
├── SETUP.md                      # Detailed setup guide
├── AGENTS.md                     # AI agent instructions
├── .env.example                  # Environment variable template
└── package.json
```

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/missionctrlbiz/moments-share-uploader.git
cd moments-share-uploader

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys (see SETUP.md)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the sharing page.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

---

## How It Works

### For Visitors (Public Page)

1. Open the shared link
2. See a beautiful animated page with "Hello, I'm Bibi. Nice to meet you." (changes each visit)
3. Choose what to share: Photo, Video, Link, or File
4. Upload or paste content
5. Optionally add name, phone, email, and a message
6. Review and send
7. Confetti explodes, success screen appears

### For Bibi (Admin Dashboard)

1. Open `/admin`
2. See real-time stats: total uploads, photos, videos, links
3. Browse uploads with sender info, messages, and file lists
4. Click any upload to view details and use image enhance tools
5. Get email notifications for every new upload
6. Dashboard auto-refreshes every 15 seconds

---

## Custom Domain Setup (is-a.dev)

Get a free `moments.is-a.dev` subdomain — no cost, ever.

### Step 1: Fork the Registration Repo

1. Go to [github.com/is-a-dev/register](https://github.com/is-a-dev/register)
2. Click **Fork** (fork to your account: `missionctrlbiz`)

### Step 2: Create Domain Files

In your fork, create these two files in the `/domains` folder:

**File 1:** `domains/moments.json`
```json
{
    "owner": {
        "username": "missionctrlbiz",
        "email": "missionctrlbiz@users.noreply.github.com"
    },
    "records": {
        "CNAME": "moments-share-uploader.vercel.app"
    }
}
```

### Step 3: Submit a Pull Request

1. Commit and push to your fork
2. Open a PR to [is-a-dev/register](https://github.com/is-a-dev/register)
3. Wait for review (usually 1-3 days, sometimes faster)
4. Join their [Discord](https://discord.gg/is-a-dev-830872854677422150) and post your PR link in `#pull-requests` for faster merging

### Step 4: Add Domain to Vercel

Once the PR is merged:
1. Go to your [Vercel project settings > Domains](https://vercel.com/missionctrlbizs-projects/moments-share-uploader/settings/domains)
2. Add `moments.is-a.dev`
3. Vercel auto-configures SSL

**Total cost: $0.** is-a.dev is sponsored by Cloudflare's Project Alexandria.

### Alternative Free Domains

If is-a.dev takes too long, here are other free options:

| Service | Domain Examples | Setup |
|---------|----------------|-------|
| **Vercel default** | `moments-share-uploader.vercel.app` | Already live |
| **pp.ua** | `*.pp.ua` | Free Ukrainian subdomains |
| **DigitalPlat** | `.dp.ua`, `.eu.org` | Via Cloudflare → Vercel |
| **FreeDNS** | Various community domains | CNAME to Vercel |
| **Cloudflare** | `.com` for ~$10/yr | Cheapest real TLD |

---

## CI/CD Pipeline

GitHub Actions runs on every push:

```
Push → Lint → Type Check → Build → Deploy (main only)
PR   → Lint → Type Check → Build → Preview Deployment + PR Comment
```

### Required GitHub Secrets

| Secret | Where to find |
|--------|---------------|
| `VERCEL_TOKEN` | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` (after `vercel link`) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` (after `vercel link`) |

---

## Sound Effects

All 10 sounds are generated programmatically using the Web Audio API — **no audio files to upload**:

| Sound | Description | Trigger |
|-------|-------------|---------|
| `click` | Short tap | Button presses |
| `send` | Ascending tone | Upload submission |
| `success` | Cheerful chime | Upload complete |
| `error` | Low buzz | Error states |
| `pop` | Bubble pop | File added |
| `whoosh` | Transition sweep | Step changes |
| `notification` | Gentle ding | New upload alert |
| `typing` | Keyboard click | Text input |
| `confetti` | Celebration burst | Confetti trigger |
| `navigate` | Page turn | Tab switches |

---

## Admin Dashboard Features

### Dashboard Tab
- **Stats Cards** — Total uploads, photos, videos, links with trend indicators
- **Recent Uploads** — Latest 10 uploads with sender info and timestamps
- **Uploads Over Time** — Bar chart showing daily upload activity (last 14 days)

### Uploads Tab
- **Full Upload List** — Every upload with sender name, type badge, message preview
- **Search** — Filter by sender name, message content, or type
- **Unread Indicator** — New uploads highlighted with accent border
- **Detail Modal** — Click any upload for full details + file links

### Image Enhance (in Detail Modal)
6 quick-toggle enhancements:
- **Enhance** — Auto quality boost
- **Smart Crop** — AI-powered framing
- **Brightness** — Exposure adjustment
- **Contrast** — Dynamic range boost
- **Warmth** — Color temperature
- **Sharpen** — Detail enhancement

6 prompt presets:
- **Portrait** — Natural skin tones, soft bokeh
- **Landscape** — Vibrant colors, dramatic sky
- **Food** — Warm lighting, rich colors
- **Document** — Text cleanup, perspective fix
- **Night** — Noise reduction, exposure boost
- **Vintage** — Warm film look with grain

### Settings Tab
- Email notification toggles
- Sound alert toggles
- Service connection status (Google Drive, Resend, Vercel KV)
- Shareable link with copy button

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Connect Vercel KV: `npx vercel kv connect`
4. Add environment variables
5. Deploy

Every push to `main` auto-deploys. Pull requests get preview deployments.

### CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link --scope missionctrlbizs-projects

# Deploy to production
vercel --prod --yes
```

### Environment Variables

See [SETUP.md](./SETUP.md) for complete variable documentation.

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_EMAIL` | Yes | Service account email |
| `GOOGLE_PRIVATE_KEY` | Yes | Service account private key |
| `GOOGLE_DRIVE_FOLDER_ID` | Yes | Root folder ID in Google Drive |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `NOTIFICATION_EMAIL` | Yes | Where to send notifications |
| `KV_REST_API_URL` | Auto | Vercel KV endpoint |
| `KV_REST_API_TOKEN` | Auto | Vercel KV auth token |

---

## Cost Breakdown

| Service | Free Tier | You Pay |
|---------|-----------|---------|
| **Vercel** | 100GB bandwidth, 1000 builds/mo | $0 |
| **Vercel KV** | 30K commands/day | $0 |
| **Google Drive** | 15GB storage | $0 |
| **Resend** | 100 emails/day, 3K/mo | $0 |
| **is-a.dev** | Free `.is-a.dev` subdomain | $0 |
| **GitHub** | Unlimited public repos | $0 |

**Total: $0/month** for personal use. All services have generous free tiers.

---

## License

MIT — Built with love by Bibi.

---

<div align="center">

**[Setup Guide →](./SETUP.md)**

</div>
