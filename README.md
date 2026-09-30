# CRM Dashboard

A production-quality internal and customer relationship management dashboard built with modern web technologies.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) (App Router) | React framework with server components, server actions, and file-based routing |
| [TypeScript](https://www.typescriptlang.org/) (Strict mode) | Type-safe development with compile-time error checking |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework for responsive design |
| [Supabase](https://supabase.com/) | PostgreSQL database, authentication, and Row Level Security |
| [Vercel](https://vercel.com/) | Deployment platform (configuration-ready) |

## Architecture Decisions

### Route Groups
The app uses Next.js route groups to separate concerns:
- `(auth)` — Authentication pages (login, signup, password reset) with a centered card layout
- `(protected)` — Dashboard and admin pages behind authentication middleware

### Supabase Client Strategy
Three separate Supabase client utilities handle the different Next.js rendering contexts:
- **`lib/supabase/client.ts`** — Browser client for client components
- **`lib/supabase/server.ts`** — Server client for server components, server actions, and route handlers
- **`lib/supabase/middleware.ts`** — Middleware-specific client for session refresh and route protection

### Server Actions
All authentication mutations (sign up, sign in, password reset, sign out) use Next.js Server Actions in `/actions/auth.ts`. This keeps client components thin and avoids custom API routes.

### Row Level Security (RLS)
The database enforces access control at the PostgreSQL level:
- Users can read and update their own profile
- Admins have full CRUD access to all profiles
- A trigger automatically creates a profile row when a new user signs up

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd CRM
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project dashboard under **Settings → API**.

### 3. Run the database migration

#### Option A: Supabase CLI (Recommended)

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

#### Option B: SQL Editor

Copy the contents of `supabase/migrations/0001_initial_schema.sql` and run it directly in the Supabase Dashboard SQL Editor.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth pages (login, signup, reset-password)
│   ├── (protected)/         # Protected pages (dashboard, admin)
│   ├── auth/                # Auth API routes (callback, confirm)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root redirect → /login
│   └── globals.css
├── actions/
│   └── auth.ts              # Server actions for authentication
├── components/
│   └── ui/                  # Reusable UI primitives
├── lib/
│   ├── supabase/            # Supabase client utilities
│   └── utils.ts             # Shared helpers (cn, etc.)
├── types/
│   └── database.ts          # TypeScript types for DB schema
├── supabase/
│   └── migrations/          # SQL migration files
├── middleware.ts             # Route protection middleware
└── .env.example             # Environment variable template
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Milestone Progress

- [x] **Milestone 1** — Project initialization, database schema, authentication, middleware
- [ ] **Milestone 2** — Dashboard views, data tables, analytics widgets
