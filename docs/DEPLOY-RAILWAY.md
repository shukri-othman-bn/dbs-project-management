# Deploy to Railway (Next.js + PostgreSQL)

Recommended production/demo hosting. Avoids DigitalOcean PostgreSQL 15+ `permission denied for schema public` issues during `db-setup`.

**Keep GitHub** — Railway deploys from the same repo. **Remove DigitalOcean** only after this deploy works.

---

## Prerequisites

- GitHub repo: `https://github.com/shukri-othman-bn/dbs-project-management` (branch `main`)
- [Railway](https://railway.com) account
- ~10 minutes in the Railway dashboard

Estimated cost: **~$5/month** (Hobby usage; check [Railway pricing](https://railway.com/pricing)).

---

## Step 1 — Create project

1. Go to [railway.com/new](https://railway.com/new)
2. **Deploy from GitHub repo** → authorize Railway → select **`dbs-project-management`**
3. Railway creates a service from the repo

---

## Step 2 — Find your app service settings (not “web”)

Railway does **not** create a service named `web`. You get one box per deployable thing on the **project canvas**:

| Box on canvas | What it is |
|---------------|------------|
| **GitHub repo name** (e.g. `dbs-project-management`) | Your Next.js app — **configure this one** |
| **Postgres** (database icon) | Database only — variables live here too |

**Open settings:**

1. Open your [Railway project](https://railway.com/dashboard).
2. On the canvas, **click the GitHub / repo service** (not Postgres).
3. You should see tabs across the top: **Deployments**, **Variables**, **Metrics**, **Settings** (names can vary slightly).
4. Click **Settings**, then **scroll down** — options are in sections, not one “web service” page:
   - **Source** → **Root Directory**
   - **Build** → **Custom Build Command**
   - **Deploy** → **Custom Start Command** and **Pre-Deploy Command** (this is what we called “release command”)
   - **Networking** → **Generate Domain** / public URL

**If you do not see a Settings tab:** you may be on the **project** view. Click **into** the service tile first until you see Deployments / Variables / Settings for that service only.

### Values to set (repo service)

| Section | Field | Value |
|--------|--------|--------|
| Source | **Root Directory** | `/apps/web` (or leave empty and use root build — see below) |
| Build | **Custom Build Command** | `npm ci && npm run build` |
| Deploy | **Custom Start Command** | `npm start` |
| Deploy | **Pre-Deploy Command** | `npm run db:deploy` |

Pre-deploy runs `prisma db push` + seed **before** the new version goes live.

**Root directory — two valid setups:**

- **`/apps/web`** — app builds inside `apps/web` (matches DigitalOcean).
- **Empty `/` (repo root)** — also works: root [`package.json`](../package.json) already runs `cd apps/web && npm ci && npm run build` and `npm start`.

**Config file:** [`apps/web/railway.toml`](../apps/web/railway.toml) is only picked up if Railway finds it. Because it lives under `apps/web`, set **Settings → Config-as-code file path** to `/apps/web/railway.toml`, **or** enter the Pre-Deploy / Start commands manually in **Deploy** (dashboard is enough).

---

## Step 3 — Add PostgreSQL

1. In the project canvas, click **+ New** → **Database** → **PostgreSQL**
2. Open the Postgres service → **Variables** → copy `DATABASE_URL` (or use reference variable)

---

## Step 4 — Environment variables (repo service)

Click the **GitHub repo service** → **Variables** tab (not under Settings):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Reference: `${{Postgres.DATABASE_URL}}` (adjust service name if yours differs) |
| `AUTH_SECRET` | Long random string — e.g. PowerShell: `[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))` |
| `AUTH_URL` | Your Railway public URL, e.g. `https://dbs-project-management-production.up.railway.app` |
| `NEXTAUTH_URL` | Same as `AUTH_URL` |
| `AUTH_TRUST_HOST` | `true` |
| `NODE_ENV` | `production` |

**Important:** After the first deploy, open **Settings → Networking → Generate Domain**, then set `AUTH_URL` and `NEXTAUTH_URL` to that HTTPS URL and **redeploy**.

---

## Step 5 — Deploy and verify

1. **Deploy** (or push to `main` if auto-deploy is on)
2. Wait for build + release (`db:deploy`) to finish
3. Open `https://<your-domain>/api/health` — expect:

```json
{
  "ok": true,
  "database": "connected",
  "users": 5
}
```

4. **Login:** `/login` → `director@dbs.gov.bn` / `password123`

---

## Step 6 — Turn off DigitalOcean

Only after Railway health is OK:

1. [DigitalOcean Apps](https://cloud.digitalocean.com/apps) → destroy old app(s) (`seal-app`, `dbs-project-management`, etc.)
2. Destroy unused **PostgreSQL** cluster `dbs-db` if nothing else uses it

---

## Updates after code changes

```powershell
cd "d:\DBS PROJECT MANAGEMENT"
git add -A
git commit -m "Your change"
git push
```

Railway redeploys on push when GitHub integration is enabled.

---

## Local development

See [DEPLOY-DIGITALOCEAN.md — Local development](DEPLOY-DIGITALOCEAN.md#local-development-after-postgresql-switch) (Docker Postgres + `.env` in `apps/web`).

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Build fails `prisma not found` | Root Directory must be `apps/web` |
| Release fails on DB | Check `DATABASE_URL` is set on **web** service; Postgres plugin is in same project |
| `/api/health` `ok: false`, no `DATABASE_URL` | Add `DATABASE_URL` variable; redeploy |
| Login fails | Set `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST=true` |
| `users: 0` | Re-run deploy (release runs `db:seed`) or Railway shell: `npm run db:deploy` |
| Blank page | Try `/login` in incognito; check `/api/health` first |

---

## Legacy: DigitalOcean

If you must stay on DO, see [DEPLOY-DIGITALOCEAN.md](DEPLOY-DIGITALOCEAN.md) and run the admin GRANT script once before `db-setup`.
