-- Migrate LifecycleStage enum to the six-stage model before prisma db push.
-- Idempotent: skips when the new enum is already in place.
-- Cleans up orphaned types left by a failed prisma db push.

DROP TYPE IF EXISTS "LifecycleStage_new";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LifecycleStage'
      AND e.enumlabel IN ('planning', 'pre_contract', 'contract', 'closed')
  ) THEN
    ALTER TYPE "LifecycleStage" RENAME TO "LifecycleStage_old";

    CREATE TYPE "LifecycleStage" AS ENUM (
      'pre_design',
      'design',
      'quotation_tender',
      'ongoing',
      'completed',
      'keep_in_view'
    );

    ALTER TABLE "Project"
      ALTER COLUMN "lifecycleStage" DROP DEFAULT;

    ALTER TABLE "Project"
      ALTER COLUMN "lifecycleStage" TYPE "LifecycleStage"
      USING (
        CASE "lifecycleStage"::text
          WHEN 'planning' THEN 'pre_design'
          WHEN 'pre_contract' THEN 'quotation_tender'
          WHEN 'contract' THEN 'quotation_tender'
          WHEN 'ongoing' THEN 'ongoing'
          WHEN 'closed' THEN 'completed'
          ELSE 'pre_design'
        END::"LifecycleStage"
      );

    ALTER TABLE "Project"
      ALTER COLUMN "lifecycleStage" SET DEFAULT 'pre_design';

    DROP TYPE "LifecycleStage_old";
  END IF;
END $$;
