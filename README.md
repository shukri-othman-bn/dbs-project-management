# DBS Department Project & Budget Platform

Web application for department project visibility and financial year budget monitoring. Directors see portfolio and budget dashboards; officers update projects through a single project page.

## Quick start

```bash
cd apps/web
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (password: `password123`)

| Role | Email |
|------|-------|
| Director | director@dbs.gov.bn |
| Admin | admin@dbs.gov.bn |
| Head of Section | hos@dbs.gov.bn |
| Officer | officer1@dbs.gov.bn |

## Features

- **Director dashboard** — project counts, attention flags, FY budget KPIs, section chart
- **Budget dashboard** — allocation vs warrant vs spent, RAG indicators, funding breakdown
- **Projects** — list, create, edit, single-page tabs (Overview / Status / Budget / Contract)
- **Quick status update** — physical %, payment %, remarks, actions required in one form
- **Budget tab** — FY allocation, encumbrance, warrant and payment lines
- **Admin** — sections, financial years, funding types, clients, users
- **Export** — CSV for project list and budget summary

## Database

- **Development:** SQLite (`apps/web/prisma/dev.db`)
- **Production:** Set `DATABASE_URL` to PostgreSQL in `apps/web/.env` and change `provider` in `prisma/schema.prisma` to `postgresql`, then run `npx prisma db push`.

## Project structure

```
apps/web/           Next.js application
  prisma/           Schema and seed data
  src/
    app/            Pages and API routes
    components/     UI and forms
    lib/            Auth, data, budget calculations
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env` and set:

- `DATABASE_URL` — database connection
- `AUTH_SECRET` — random string for session signing
- `NEXTAUTH_URL` — app URL (e.g. http://localhost:3000)
