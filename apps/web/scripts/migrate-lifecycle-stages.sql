-- Migrate LifecycleStage enum to the new six-stage model.
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
