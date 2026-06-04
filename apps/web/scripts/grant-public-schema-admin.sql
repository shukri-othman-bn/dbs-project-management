-- =============================================================================
-- FULL GRANT for DigitalOcean PostgreSQL (15+) + Prisma db push
-- =============================================================================
-- Run as ADMIN (doadmin or primary user from Connection Details), NOT the app user.
-- 1. Replace YOUR_APP_DB_USER with username from DATABASE_URL (before @)
-- 2. Replace YOUR_DATABASE_NAME with database name from DATABASE_URL (path after /)
--    Example: postgresql://user:pass@host:25060/defaultdb  ->  defaultdb
-- 3. Execute in DO database console, psql, or pgAdmin
-- =============================================================================

-- Database-level
GRANT CONNECT ON DATABASE "YOUR_DATABASE_NAME" TO "YOUR_APP_DB_USER";
GRANT ALL PRIVILEGES ON DATABASE "YOUR_DATABASE_NAME" TO "YOUR_APP_DB_USER";

-- Schema public (required for Prisma enums/tables)
GRANT USAGE ON SCHEMA public TO "YOUR_APP_DB_USER";
GRANT CREATE ON SCHEMA public TO "YOUR_APP_DB_USER";
GRANT ALL PRIVILEGES ON SCHEMA public TO "YOUR_APP_DB_USER";

-- Existing objects (safe if none exist yet)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "YOUR_APP_DB_USER";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "YOUR_APP_DB_USER";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "YOUR_APP_DB_USER";
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO "YOUR_APP_DB_USER";

-- Future objects Prisma creates
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "YOUR_APP_DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "YOUR_APP_DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "YOUR_APP_DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO "YOUR_APP_DB_USER";

-- Dev-only: make app user owner of public (use on DO dev DB if grants above are not enough)
-- ALTER SCHEMA public OWNER TO "YOUR_APP_DB_USER";
