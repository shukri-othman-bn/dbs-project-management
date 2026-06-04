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

## Step 2 — Configure the web service

Open the **web** service → **Settings**:

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/web` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Release Command** | `npm run db:deploy` |

The release command runs `prisma db push` and seeds demo data **before** each deploy goes live.

Optional: this repo includes [`apps/web/railway.toml`](../apps/web/railway.toml) with start/release commands if Railway detects it.

---

## Step 3 — Add PostgreSQL

1. In the project canvas, click **+ New** → **Database** → **PostgreSQL**
2. Open the Postgres service → **Variables** → copy `DATABASE_URL` (or use reference variable)

---

## Step 4 — Environment variables (web service)

**web** service → **Variables**:

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
