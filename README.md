# CRM Dashboard

A production-quality, multi-tenant customer relationship management dashboard with AI-powered revenue forecasting.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) (App Router) | React framework with server components, server actions, and file-based routing |
| [TypeScript](https://www.typescriptlang.org/) (Strict mode) | Type-safe development with compile-time error checking |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework for responsive design |
| [Supabase](https://supabase.com/) | PostgreSQL database, authentication, and Row Level Security |
| [Recharts](https://recharts.org/) | Composable charting library for the forecasting dashboard |
| [Python / Flask](https://flask.palletsprojects.com/) | AI microservice for TensorFlow-based revenue forecasting |
| [TensorFlow](https://www.tensorflow.org/) | Machine learning framework for time-series prediction |
| [Vercel](https://vercel.com/) | Deployment platform (configuration-ready) |

## Architecture Decisions

### Multi-Tenant Workspaces
Every user belongs to one or more **workspaces**. Data (customers, revenue) is scoped per-workspace via foreign keys and RLS policies. A default personal workspace is auto-created on signup via a PostgreSQL trigger.

### Role-Based Access Control (RBAC)
Two levels of roles:
- **System-level**: `admin` / `customer` on the `profiles` table — admins have full system access
- **Workspace-level**: `owner` / `admin` / `member` on `workspace_members` — controls who can manage settings and members

### Route Groups
- `(auth)` — Authentication pages (login, signup, password reset) with a centered card layout
- `(protected)` — Dashboard and admin pages behind authentication middleware with a sidebar layout

### Supabase Client Strategy
Three separate Supabase client utilities handle the different Next.js rendering contexts:
- **`lib/supabase/client.ts`** — Browser client for client components
- **`lib/supabase/server.ts`** — Server client for server components, server actions, and route handlers
- **`lib/supabase/middleware.ts`** — Middleware-specific client for session refresh and route protection

### AI Microservice Architecture
A standalone Python/Flask service runs TensorFlow predictions:
- Next.js API route (`/api/analytics`) acts as an authenticated proxy
- Flask service (`/ai-service`) trains a small neural network on provided historical data
- Graceful fallback: if the Flask service is unavailable, mock forecasts are returned

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm
- Python 3.9–3.12 (for AI service)
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
AI_SERVICE_URL=http://localhost:5001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run the database migrations

#### Option A: Supabase CLI (Recommended)

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

#### Option B: SQL Editor

Run the contents of the migration files in order in the Supabase Dashboard SQL Editor:
1. `supabase/migrations/0001_initial_schema.sql` (Profiles, auth trigger, basic RLS)
2. `supabase/migrations/0002_multi_tenant_schema.sql` (Workspaces, members, customers, initial RLS)
3. `supabase/migrations/0003_fix_workspace_and_admin_rbac.sql` (Workspace RLS fixes, auto-creation backfill, admin helpers)
4. `supabase/migrations/0004_fix_infinite_recursion_rls.sql` (Non-recursive SECURITY DEFINER RLS policies)
5. `supabase/migrations/0005_audit_logs.sql` (Activity audit logs table, RLS, and performance indexes)

### 4. Admin Account Provisioning

When a user signs up, they receive the `'customer'` role by default. To elevate an account to `'admin'`:

- **Option 1: One-Click UI Claim (Dev/Bootstrap)**: Navigate to `/admin` while logged in. If no admins exist in the system, click the **"Claim Admin Role Now"** button.
- **Option 2: CLI Script**: Run `npm run set-admin <user-email>` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`).
- **Option 3: Supabase SQL Editor**: Run:
  ```sql
  UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
  ```
- **Option 4: Admin Panel UI**: Once you are an admin, navigate to `/admin` to promote or demote any user via the interactive Users table or the "Grant Admin Role by Email" form.

### 5. Start the AI microservice (optional)

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

The service runs on port 5001. The dashboard will use mock forecasts if this service is unavailable.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── (auth)/                          # Auth pages (login, signup, reset-password)
│   ├── (protected)/
│   │   ├── layout.tsx                   # Sidebar layout with workspace switcher
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 # Workspace overview with stats
│   │   │   ├── forecasting/page.tsx     # AI-powered revenue forecasting
│   │   │   └── workspace/settings/      # Member management
│   │   └── admin/                       # System-wide admin panel & audit logs
│   ├── api/analytics/route.ts           # Secure proxy to Flask AI service
│   └── auth/                            # Auth callback routes
├── actions/
│   ├── auth.ts                          # Auth server actions (with audit logging)
│   ├── workspace.ts                     # Workspace CRUD server actions (with audit logging)
│   └── admin.ts                         # Admin role management server actions (with audit logging)
├── components/
│   ├── ui/                              # Reusable UI primitives
│   ├── dashboard/                       # Sidebar, workspace switcher, data table, stats
│   └── charts/                          # Recharts forecast chart
├── lib/
│   ├── logger.ts                        # Server-side audit logging utility
│   ├── utils.ts                         # Tailwind class merge helper
│   └── supabase/                        # Supabase client utilities & auto-provisioning
├── types/database.ts                    # Full TypeScript types for DB schema & audit logs
├── supabase/migrations/                 # SQL migration files (0001 - 0005)
├── ai-service/                          # Python Flask AI microservice
├── tests/
│   ├── unit/                            # Jest unit tests (utils, UI components)
│   └── e2e/                             # Playwright E2E tests (auth redirect, forms)
├── .github/workflows/ci.yml             # GitHub Actions CI workflow (lint, test, build)
├── middleware.ts                        # Route protection middleware
└── .env.example                         # Environment variable template
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint across codebase |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Run Jest unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E test suite |
| `npm run set-admin <email>` | Promote user account to admin via CLI |
| `cd ai-service && python app.py` | Start AI forecasting microservice |

## Enterprise Maturity & QA

- [x] **Activity Audit Logs** — Database-backed audit trail for workspaces, members, roles, and auth actions.
- [x] **Unit Testing (Jest + RTL)** — Automated unit tests with `@testing-library/react` and `jest-dom`.
- [x] **E2E Testing (Playwright)** — End-to-end tests covering unauthenticated route protection and login navigation.
- [x] **CI/CD Pipeline** — GitHub Actions workflow enforcing linting, unit testing, and production build checks on pushes and PRs.
