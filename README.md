# Invoke

A Next.js web application for Invoke AI - SMS-based conversational assistant for tasks, reminders, planning, and coordination.

## Features

- **Waitlist Signup** (`/`) - Public landing page with phone number collection
- **Web Chat Preview** (`/preview`) - Browser-based SMS simulator with the same intake flow as Twilio
- **Admin Dashboard** (`/admin`) - View waitlist count, recent signups, and messages
- **Privacy & Terms** - Compliance pages for A2P 10DLC registration

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres)

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)

### 1. Clone and Install

```bash
git clone https://github.com/kyle-invokeai/useinvoke-site.git
cd useinvoke-site
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your credentials
3. Run the database migration:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy and paste the SQL, then run it

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Dashboard (Required)
ADMIN_PASSWORD=your-secure-password
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | Yes |
| `ADMIN_PASSWORD` | Password for accessing /admin dashboard | Yes |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo into [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

### GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that auto-deploys to GitHub Pages on every push to `main`.

1. Enable GitHub Pages in repo settings (Source: GitHub Actions)
2. Push to main branch

## API Routes

- `POST /api/waitlist` - Join the waitlist
- `POST /api/invoke` - Process chat messages (used by both web and SMS)
- `POST /api/admin/auth` - Admin authentication
- `GET /api/admin/stats` - Waitlist count
- `GET /api/admin/signups` - Recent signups
- `GET /api/admin/messages` - Recent messages

## Database Schema

### waitlist_users
- `id` (uuid, pk)
- `phone` (text, unique)
- `source` (text) - 'web' or 'sms'
- `status` (text) - 'waitlist', 'active', etc.
- `interest_category` (int, nullable) - 1-6 for user preference
- `created_at` (timestamptz)

### conversations
- `id` (uuid, pk)
- `phone` (text, unique)
- `state` (jsonb) - Conversation state (step, lastMessageAt)
- `updated_at` (timestamptz)

### messages
- `id` (uuid, pk)
- `phone` (text)
- `direction` (text) - 'inbound' or 'outbound'
- `body` (text)
- `channel` (text) - 'web' or 'sms'
- `created_at` (timestamptz)

## Conversation Flow

The shared conversation logic in `lib/invoke.ts` handles:

1. **Trigger Detection** - Recognizes "//invoke", "hello", "hi", "start"
2. **Intake Question** - Asks user to select category (1-6)
3. **Category Storage** - Saves preference to user record
4. **Completion** - Confirms waitlist placement

Both the web preview and SMS webhook use this same logic module.

## License

MIT
