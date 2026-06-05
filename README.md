# DBS Department Project & Budget Platform

Web application for department project visibility and financial year budget monitoring. Directors see portfolio and budget dashboards; officers update projects through a single project page.

## Quick start

Start PostgreSQL (Docker example):

```bash
docker run -d --name dbs-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dbs postgres:16
```

```bash
cd apps/web
cp .env.example .env   # or copy on Windows
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
| Unit lead (BM1) | officer1@dbs.gov.bn |
| Unit lead (BM2) | officer2@dbs.gov.bn |
| … | officer3@ … officer13@ (BM3–BM10, IMU1–IMU3) |

## Features

- **Director dashboard** — project counts, attention flags, FY budget KPIs, section chart
- **Budget dashboard** — allocation vs warrant vs spent, RAG indicators, funding breakdown
- **Projects** — list, create, edit, single-page tabs (Overview / Status / Budget / Contract)
- **Quick status update** — physical %, payment %, remarks, actions required in one form
- **Budget tab** — FY allocation, encumbrance, warrant and payment lines
- **Admin** — sections, financial years, funding types, clients, users
- **Export** — CSV for project list and budget summary

## Database

- **PostgreSQL** via Prisma (`apps/web/prisma/schema.prisma`)
- **Local:** Docker Postgres or any Postgres instance — see [docs/DEPLOY-DIGITALOCEAN.md](docs/DEPLOY-DIGITALOCEAN.md)
- **Production (recommended):** [Railway](docs/DEPLOY-RAILWAY.md) — Next.js + Postgres, no manual schema grants
- **Legacy:** [DigitalOcean](docs/DEPLOY-DIGITALOCEAN.md) — App Platform + managed Postgres

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

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — random string for session signing
- `AUTH_URL` / `NEXTAUTH_URL` — app URL (e.g. http://localhost:3000)

## Deploy (public URL for review)

**Railway (recommended):** [docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md)

**DigitalOcean (legacy):** [docs/DEPLOY-DIGITALOCEAN.md](docs/DEPLOY-DIGITALOCEAN.md)
