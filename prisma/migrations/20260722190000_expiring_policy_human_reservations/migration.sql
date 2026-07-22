-- The Policy model was never used by the application. Export its contents with
-- `npm run db:export:orphan-policy` before applying this migration.
DROP TABLE IF EXISTS "Policy";

ALTER TABLE "PolicyHumanReservation" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Existing rows predate expiring authorizations. Give them the same 30-day
-- lifetime used by the server, measured from their original reservation time.
UPDATE "PolicyHumanReservation"
SET "expiresAt" = "createdAt" + INTERVAL '30 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "PolicyHumanReservation"
ALTER COLUMN "expiresAt" SET NOT NULL;
