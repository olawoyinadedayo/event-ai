# EventPilot — AI-Powered Event Seating & Guest Management

A prosumer event planning platform serving professional planners (B2B) and DIY hosts (B2C). The core module is a **collaborative guest list & drag-and-drop seating chart** with an AI intelligence layer.

## Tech Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS 4**
- **@dnd-kit** for drag-and-drop seating
- **Vercel AI SDK** (`generateObject` structured outputs, streaming chat) with **Groq** (`openai/gpt-oss-120b`) via the OpenAI-compatible provider
- **Supabase** (PostgreSQL, Auth, Realtime)
- **Deploy target**: Vercel

## Features

### Core
- Guest list management with search, tag & RSVP filters
- Drag-and-drop seating: drag guests from the sidebar onto seats (or whole tables)
- Table repositioning by dragging the table body
- Round & rectangular tables with auto-laid-out seat positions
- Dietary-requirement warnings shown on occupied seats
- Live multi-user sync via Supabase Realtime

### AI Layer
- **Smart Paste** — paste a messy email/chat/list (AI extracts structured guests) **or upload a CSV** (columns auto-detected). Both feed an editable preview before bulk import
- **Google & GitHub OAuth** sign-in in addition to email/password
- **Auto-Seat** — AI assigns unassigned guests to tables honoring capacities, tags, dietary grouping, and free-text instructions
- **Co-Pilot Chat** — streaming event assistant with live event context (timelines, vendor checklists, seating advice)

## Getting Started

### 1. Prerequisites
- Node.js 20+
- A Supabase project (https://supabase.com)
- A Groq API key (https://console.groq.com) — free tier available

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=            # http://localhost:3000 locally, your Vercel URL in prod
GROQ_API_KEY=                   # gsk_... from https://console.groq.com
```

> AI features run on Groq's OpenAI-compatible API (`https://api.groq.com/openai/v1`) via the Vercel AI SDK `@ai-sdk/openai-compatible` provider. The default model is `openai/gpt-oss-120b` (the official replacement for the retired `llama-3.3-70b-versatile`). Override with `GROQ_FAST_MODEL` / `GROQ_SMART_MODEL` if desired.

### Google / GitHub OAuth
1. In Supabase Dashboard → **Authentication → Providers**, enable **Google** and **GitHub**.
2. Create credentials in the Google Cloud Console / GitHub Developer Settings and paste the Client ID / Secret.
3. Add the callback URL shown in Supabase (e.g. `https://<your-ref>.supabase.co/auth/v1/callback`) to each provider.
4. Set `NEXT_PUBLIC_APP_URL` to your app origin so the OAuth redirect back to your app is correct.

### 3. Database
Run the migrations in `supabase/migrations/` in order (001→005) in your Supabase SQL editor, or via the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Migrations create the `users`, `events`, `tables`, `guests` tables, enable Row-Level Security, add the auto-profile trigger for new signups, and enable Realtime for `guests` and `tables`.

Optional demo data lives in `supabase/seed.sql`.

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, then create an event.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # login, signup, server actions
│   ├── api/chat/            # Co-Pilot streaming endpoint
│   ├── auth/callback/       # OAuth callback
│   ├── dashboard/           # event list
│   ├── events/
│   │   ├── new/             # event creation
│   │   └── [eventId]/       # workspace (page, server actions)
│   │       └── workspace/   # GuestSidebar, FloorPlanCanvas, TableNode,
│   │                        # SeatNode, dialogs, ai/ (SmartPaste, AutoSeat, CoPilot)
├── components/ui/           # button, input, badge, etc.
├── lib/
│   ├── supabase/            # client, server, admin, middleware
│   ├── seat-geometry.ts     # seat position math
│   └── utils.ts
└── types/                   # database.ts, app.ts, ai.ts (Zod schemas)
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check

## Deployment (Vercel)

1. Push to a Git repo.
2. Import into Vercel (framework: Next.js).
3. Add all env vars above.
4. Deploy. Realtime works out of the box (Supabase WebSocket), no extra config needed.