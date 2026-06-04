# Deploy to DigitalOcean (App Platform + PostgreSQL)

This guide gets a **public URL** (e.g. `https://dbs-project-management-xxxxx.ondigitalocean.app`) so you can open the app from any PC.

You only need **DigitalOcean** — no Supabase required.

---

## What you need

- DigitalOcean account
- GitHub repo: `https://github.com/shukri-othman-bn/dbs-project-management`
- ~10 minutes in the DO control panel

Estimated cost (review/demo): **~$5–12/month** (smallest app + dev database). Check current pricing on [DigitalOcean App Platform](https://www.digitalocean.com/pricing/app-platform).

---

## Part 1 — Push latest code to GitHub

On your dev PC:

```powershell
cd "d:\DBS PROJECT MANAGEMENT"
git add -A
git commit -m "Add DigitalOcean App Platform deployment config"
git push
```

---

## Part 2 — Create the app on DigitalOcean

1. Go to [https://cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. **Source:** GitHub → authorize DO if asked → select repo **`dbs-project-management`**
4. Branch: **`main`**
5. If DO asks to use an app spec: choose **Edit App Spec** and paste the contents of [`.do/app.yaml`](../.do/app.yaml), **or** configure manually (Part 3).

---

## Part 3 — Manual settings (if not using app spec)

| Setting | Value |
|--------|--------|
| **Source directory** | `apps/web` (**required** — if left blank, DO builds from repo root and `prisma` will not be found) |
| **Type** | Web Service |
| **Build command** | `npm ci && npm run build` |
| **Run command** | `npm start` |
| **HTTP port** | `3000` |
| **Region** | Singapore (`sgp`) recommended |

### Add PostgreSQL database

1. On the create-app flow, click **Add Resource** → **Database**
2. **PostgreSQL 16**
3. Name: `dbs-db` (must match `${dbs-db.DATABASE_URL}` in the spec)

### Environment variables (web service)

| Key | Value | Encrypted? |
|-----|--------|------------|
| `DATABASE_URL` | `${dbs-db.DATABASE_URL}` | Yes (bindable) |
| `AUTH_SECRET` | Generate: run `openssl rand -base64 32` or use a long random string | **Yes** |
| `AUTH_URL` | `${APP_URL}` | No |
| `NEXTAUTH_URL` | `${APP_URL}` | No |
| `AUTH_TRUST_HOST` | `true` | No |
| `NODE_ENV` | `production` | No |

**Important:** `AUTH_SECRET` must be set before the first successful login.

### Pre-deploy job (database tables + demo data)

Add a **Job** component:

| Setting | Value |
|--------|--------|
| **Name** | `db-setup` |
| **Kind** | **Before Deploy** (PRE_DEPLOY) |
| **Source directory** | `apps/web` |
| **Run command** | `npm ci && npm run db:deploy:do` |
| **Env** | `DATABASE_URL` = `${dbs-db.DATABASE_URL}` |

The seed script uses `upsert`, so re-runs are safe.

---

## Part 4 — Deploy

1. Review plan/size (start with smallest **Basic** web instance if budget matters)
2. Click **Create Resources** / **Deploy**
3. Wait 5–15 minutes for build + deploy (first deploy is slower)

---

## Part 5 — Your review URL

When deploy shows **Active**:

1. Open the app in DO → copy **Live URL** (e.g. `https://dbs-project-management-xxxxx.ondigitalocean.app`)
2. Share that link — works from **any PC/browser**
3. Log in with demo accounts (password `password123`):

| Role | Email |
|------|--------|
| Director | director@dbs.gov.bn |
| Admin | admin@dbs.gov.bn |
| Officer | officer1@dbs.gov.bn |

---

## Part 6 — Updates after code changes

```powershell
git add -A
git commit -m "Your change description"
git push
```

DO redeploys automatically if **deploy on push** is enabled.

---

## Local development (after PostgreSQL switch)

The app now uses **PostgreSQL** (not SQLite). Options:

**A — Docker (easiest on Windows):**

```powershell
docker run -d --name dbs-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dbs postgres:16
```

In `apps/web/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dbs"
AUTH_SECRET="local-dev-secret"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Then:

```powershell
cd apps/web
npm install
npx prisma db push
npm run db:seed
npm run dev
```

**B — Use the DO database connection string** in local `.env` (only for debugging; not ideal for daily dev).

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| **Build Error: Non-Zero Exit** | Open **Activity → Go to Build Logs**. Common fixes: set `AUTH_SECRET` (encrypted), ensure `DATABASE_URL` = `${dbs-db.DATABASE_URL}` for build+run, push latest `main` (includes monorepo/Turbopack fix). |
| **`prisma: not found`** | Set **Source directory** to `apps/web`, or use latest root `package.json` `build` script (`cd apps/web && npm ci && npm run build`). |
| Build fails on Prisma | Ensure `DATABASE_URL` is set for **Build & Run** |
| Login fails / UntrustedHost | Set `AUTH_TRUST_HOST=true` and `AUTH_URL=${APP_URL}` |
| 500 on all pages | Check **Runtime Logs**; run `db-setup` job or `npm run db:deploy` locally against DO DB once |
| Empty database | Re-run deploy or trigger **db-setup** job manually |
| **`permission denied for schema public`** (db-setup / `prisma db push`) | PostgreSQL 15+ on DigitalOcean: the app DB user needs CREATE on `public`. See **Fix: schema public permissions** below. |
| **Blank white page** | Open `/api/health` — if `ok: false`, fix `DATABASE_URL` and run `npm run db:deploy` in DO **Console**. Try `/login` in incognito. |

### Fix: schema public permissions

If **db-setup** fails with `permission denied for schema public`:

1. In DigitalOcean, open your Postgres (**`dbs-db`** component → **Connection Details**, or the **Databases** page for a managed cluster).
2. Connect with the **admin** user (`doadmin` on managed DB, or the primary user from connection details — not a read-only pool URL).
3. Run the **full grant** script once. Edit placeholders, then execute in DO SQL console or `psql`:

   File: [`apps/web/scripts/grant-public-schema-admin.sql`](../apps/web/scripts/grant-public-schema-admin.sql)

   Replace:
   - `YOUR_APP_DB_USER` — username from `${dbs-db.DATABASE_URL}` (before `@`)
   - `YOUR_DATABASE_NAME` — database name from the URL (after the last `/`, before `?`)

4. **Redeploy** the app (or re-run **db-setup**).

From your PC (if you have `psql`), with the **admin** connection string:

```powershell
cd "d:\DBS PROJECT MANAGEMENT\apps\web"
# Edit scripts/grant-public-schema-admin.sql placeholders first, then:
psql $env:DATABASE_URL -f scripts/grant-public-schema-admin.sql
npm run db:deploy
```

Deploy also runs `npm run db:deploy:do` (includes `db:bootstrap` / `scripts/grant-public-schema.sql` as the app user). You still need the **admin** script once on DigitalOcean. Railway uses `npm run db:deploy` without bootstrap — see [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).

---

## Optional: use existing DO Managed Database

If you already created Postgres on DO:

1. Skip adding a new DB in the app spec
2. Set `DATABASE_URL` to that cluster’s connection string (with `sslmode=require`)
3. Run `npm run db:deploy` once from your PC with that URL exported
