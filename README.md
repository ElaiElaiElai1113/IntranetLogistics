# Logistics Project Financial Intranet

Internal (no-auth) dashboard for managing logistics project financials, recreating the
source spreadsheet's logic. Built with **Vite + React + TypeScript + Tailwind**, backed by
**Supabase** (hosted Postgres).

## Features

- Dashboard with summary cards (capital, revenue, cost, profit, average ROI, active count,
  best-ROI project) across all active projects.
- Left sidebar with the active project list, Add Project, and an archived-projects toggle.
- Project detail page: edit figures with **live-recalculated** results, then Save to Supabase.
- Add new projects (only the name is required).
- Soft-delete via **Archive** (status = `archived`) with one-click Restore — no hard deletes.

## Financial formulas

```
totalCost   = revenue * (costPercentage / 100)
profit      = revenue - totalCost
splitAmount = profit * (splitPercentage / 100)
roi         = capitalInvested > 0 ? (profit / capitalInvested) * 100 : 0
finalAmount = capitalInvested + splitAmount
```

These live in `src/lib/calculations.ts` and are covered by unit tests.

## Setup

1. **Create the database.** In the Supabase SQL editor, run the contents of
   [`supabase/schema.sql`](supabase/schema.sql) (creates the `projects` table + optional seed
   rows). RLS is intentionally left disabled — this is an internal app with no auth.

2. **Configure environment.** Copy `.env.example` to `.env` and fill in your credentials:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   (`.env` is gitignored.)

3. **Install & run.**

   ```
   npm install
   npm run dev      # http://localhost:5173
   ```

## Scripts

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the dev server                     |
| `npm run build`   | Type-check (`tsc -b`) and build for prod |
| `npm run preview` | Preview the production build             |
| `npm test`        | Run unit tests (Vitest)                  |

## Deploying to Vercel

The repo includes [`vercel.json`](vercel.json) (Vite preset, `dist` output, and an SPA
rewrite so deep links like `/projects/:id` resolve on refresh).

1. Push the repo to GitHub/GitLab and **Import Project** in Vercel. The framework, build
   command (`npm run build`), and output directory (`dist`) are picked up automatically.
2. In **Project → Settings → Environment Variables**, add the same two keys from your `.env`
   (Vite inlines them at build time, so they must exist before the build runs):

   | Name                     | Value                         |
   | ------------------------ | ----------------------------- |
   | `VITE_SUPABASE_URL`      | `https://YOUR-PROJECT.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon key                 |

   Add them to **Production** (and Preview, if you want preview deploys to work).
3. Deploy. Re-deploy after changing env vars — Vite bakes them into the bundle at build time.

### ⚠️ Security note before going public

This app has **no authentication** and the `projects` table has **RLS disabled**. The
Supabase anon key is embedded in the client bundle (normal for Supabase) — so once deployed
to a public Vercel URL, **anyone who finds the URL can read, edit, and delete the data.**

For an internal tool, lock the deployment down. Options, simplest first:

- **Vercel Deployment Protection** (Settings → Deployment Protection) — password or Vercel
  account gate in front of the whole site. Quickest fix, no code changes.
- **Supabase Auth + RLS policies** — the "real" fix; deferred as a future enhancement.

Don't share the production URL publicly until one of these is in place.

## Project structure

```
src/
  components/   Layout, Sidebar, Dashboard, ProjectDetail, ProjectForm, StatCard
  lib/          supabaseClient, projects (data access), calculations, formatters
  hooks/        useProjects (context provider + hook)
  types/        project.ts
  App.tsx       routes
  main.tsx      app + providers bootstrap
```
