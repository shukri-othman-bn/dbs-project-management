# DigitalOcean: you have `dbs-db` connection details — fix deploy

Do these in order. Skip nothing.

## 1. Web service env vars (`dbs-project-management`)

**Components** → **dbs-project-management** → **Settings** → **Environment Variables** → **Edit**

| Key | Value | Scope |
|-----|--------|--------|
| `DATABASE_URL` | Paste the **full** connection string from `dbs-db` → Connection Details | **Build time + Run time** |
| `AUTH_SECRET` | Long random string (encrypted) | **Build time + Run time** |
| `AUTH_URL` | `${APP_URL}` | Run time |
| `NEXTAUTH_URL` | `${APP_URL}` | Run time |
| `AUTH_TRUST_HOST` | `true` | Run time |
| `NODE_ENV` | `production` | Run time |

**Connection string tips:**

- Must start with `postgresql://`
- If DO gives a URL without SSL, add: `?sslmode=require` at the end (before any other `?` params, use `&sslmode=require`)
- Do **not** use a “read-only” or pool URL for `db push`

**Save.**

## 2. Job env vars (`db-setup`)

**Components** → **db-setup** → **Environment Variables**

| Key | Value | Scope |
|-----|--------|--------|
| `DATABASE_URL` | **Same pasted string** as web | **Run time** |

**Save.**

## 3. Full GRANT (once, as admin)

From the connection string, note:

- **Username** (before `@`) → `YOUR_APP_DB_USER`
- **Database name** (path after `/`) → `YOUR_DATABASE_NAME`

Connect with the **admin** user (if the app user fails, use `doadmin` from a managed cluster connection string).

Run: [`apps/web/scripts/grant-public-schema-admin.sql`](../apps/web/scripts/grant-public-schema-admin.sql)  
(replace `YOUR_APP_DB_USER` and `YOUR_DATABASE_NAME`)

## 4. Deploy

**Actions** → **Force Rebuild and Deploy**

Wait until **Active**. Check:

- **Activity** → `db-setup` = success (not Undeployed)
- https://seal-app-kcq9n.ondigitalocean.app/api/health → `"ok": true`

## 5. If `db-setup` still fails

**dbs-project-management** → **Console**:

```bash
npm run db:deploy:do
```

Then check `/api/health` again.

## 6. Login

Incognito → `/login` → `director@dbs.gov.bn` / `password123`
