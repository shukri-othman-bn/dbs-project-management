/**
 * DigitalOcean DB setup — paste connection string into .do-url
 * Run: npm run do:setup
 *
 * .do-url format:
 *   Line 1: doadmin postgresql://... (database name must match app, usually dbs-db)
 *   Line 2 (optional): app username to grant, e.g. dbs-db
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const urlFile = join(root, ".do-url");
const schema = "prisma/schema.prisma";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

if (!existsSync(urlFile)) {
  console.error("\nCreate apps/web/.do-url with your doadmin connection string (one line).\n");
  process.exit(1);
}

const lines = readFileSync(urlFile, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const url = lines[0];
const grantToUser = lines[1] || null;

if (!url?.startsWith("postgresql://")) {
  console.error(".do-url line 1 must start with postgresql://");
  process.exit(1);
}

const userMatch = url.match(/^postgresql:\/\/([^:]+):/);
const dbMatch = url.match(/\/([^/?]+)(\?|$)/);
if (!userMatch || !dbMatch) {
  console.error("Could not parse .do-url");
  process.exit(1);
}

const connectUser = userMatch[1];
const dbName = dbMatch[1];
const targetUser = grantToUser || connectUser;

function runPrisma(args, input) {
  const r = spawnSync(npx, ["prisma", ...args], {
    cwd: root,
    stdio: input ? ["pipe", "pipe", "inherit"] : "inherit",
    input,
    env: { ...process.env, DATABASE_URL: url },
  });
  if (r.status !== 0) {
    const err = r.stderr?.toString() || "";
    if (err) console.error(err);
    throw new Error(`prisma failed (exit ${r.status})`);
  }
}

console.log(`\nConnect as: ${connectUser}`);
console.log(`Database:   ${dbName}`);
console.log(`Grant to:   ${targetUser}`);

if (dbName === "defaultdb") {
  console.warn(
    "\nWARNING: database is 'defaultdb'. Your app may use 'dbs-db'.\n" +
      "In DO Databases → Connection details, pick database 'dbs-db' and copy that URL.\n" +
      "Or set DATABASE_URL on the app to use 'defaultdb' everywhere.\n"
  );
}

const isAdmin = connectUser === "doadmin" || connectUser === "postgres";

if (!isAdmin) {
  console.log("\nStep 1/3: GRANT (needs doadmin on line 1 of .do-url)...");
  const grants = [
    `GRANT USAGE ON SCHEMA public TO "${targetUser}"`,
    `GRANT CREATE ON SCHEMA public TO "${targetUser}"`,
    `GRANT ALL PRIVILEGES ON SCHEMA public TO "${targetUser}"`,
    `ALTER SCHEMA public OWNER TO "${targetUser}"`,
  ];
  for (const sql of grants) {
    console.log(`  ${sql}`);
    try {
      runPrisma(["db", "execute", "--stdin", "--url", url, "--schema", schema], sql);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      console.error("  Use doadmin URL in .do-url line 1, optional line 2: dbs-db");
      process.exit(1);
    }
  }
} else {
  console.log("\nStep 1/3: Skipped (doadmin can create tables directly).");
  if (targetUser !== connectUser) {
    console.log(`  (Optional: add line 2 in .do-url: ${targetUser} — grants skipped for doadmin)`);
  }
}

console.log("\nStep 2/3: prisma db push...");
const push = spawnSync(npx, ["prisma", "db", "push", "--url", url, "--schema", schema], {
  cwd: root,
  stdio: "pipe",
  encoding: "utf8",
  env: { ...process.env, DATABASE_URL: url },
});
if (push.stdout) process.stdout.write(push.stdout);
if (push.stderr) process.stderr.write(push.stderr);
if (push.status !== 0) {
  console.error("\ndb push FAILED. Try:");
  console.error("  A) Databases → Trusted Sources → add IP 61.6.228.237 (or Allow all temporarily)");
  console.error("  B) Setup from DO instead (no PC firewall) — see docs/DO-SETUP-IN-CONSOLE.md");
  process.exit(1);
}

console.log("\nStep 3/3: prisma db seed...");
process.env.DATABASE_URL = url;
runPrisma(["db", "seed", "--schema", schema]);

console.log("\nDone.");
console.log("On DigitalOcean WEB service, set DATABASE_URL to the APP user string");
console.log("(Apps → seal-app → dbs-db → Connection string), NOT doadmin.\n");
