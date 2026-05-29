# AGENTS.md

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - TypeScript type check

## Project Structure
- `src/app/page.tsx` - Main sharing page (public-facing)
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/api/upload/route.ts` - File upload API
- `src/app/api/files/route.ts` - Files listing API
- `src/components/ShareForm.tsx` - Multi-step share form
- `src/components/ThreeBackground.tsx` - Three.js animated background
- `src/lib/google-drive.ts` - Google Drive integration
- `src/lib/notifications.ts` - Email notification via Resend
- `src/lib/utils.ts` - Shared utilities and constants

## Environment Variables
See `.env.example` for required environment variables:
- `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` - Google Drive
- `RESEND_API_KEY`, `NOTIFICATION_EMAIL` - Email notifications

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- Three.js via @react-three/fiber
- Framer Motion
- canvas-confetti
- Google Drive API
- Resend (email)
- Lucide React icons
