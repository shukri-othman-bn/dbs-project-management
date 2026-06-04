# Set up database from DigitalOcean (no PC / no Trusted Sources)

Use this if `npm run do:setup` fails from your computer.

## 1. Env vars on **db-setup** job

**Apps** → **seal-app** → **db-setup** → **Settings** → **Environment Variables**

| Key | Value |
|-----|--------|
| `DATABASE_URL` | **doadmin** connection string from [Databases](https://cloud.digitalocean.com/databases) → cluster → user **doadmin** → database **dbs-db** |

**Run command** (if you can edit it):

```
npm ci && npx prisma db push && npx prisma db seed
```

**Save.**

## 2. Env vars on **web** service

**dbs-project-management** → Environment Variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | `${dbs-db.DATABASE_URL}` or app connection string from **dbs-db** component |
| `AUTH_SECRET` | random (encrypted, Build + Run) |
| `AUTH_URL` | `${APP_URL}` |
| `NEXTAUTH_URL` | `${APP_URL}` |
| `AUTH_TRUST_HOST` | `true` |

## 3. Deploy

**Actions** → **Force Rebuild and Deploy**

Wait for **db-setup** = success, then web = Active.

## 4. Verify

https://seal-app-kcq9n.ondigitalocean.app/api/health → `"ok": true`

## 5. Optional: Console on web

If db-setup still fails, **dbs-project-management** → **Console**:

```bash
npx prisma db push
npx prisma db seed
```

(Uses `DATABASE_URL` already on the component.)
