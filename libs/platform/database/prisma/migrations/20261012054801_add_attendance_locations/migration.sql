-- CreateTable
CREATE TABLE "attendance_locations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "attendance_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_locations_tenant_id_idx" ON "attendance_locations"("tenant_id");

ALTER TABLE "attendance_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_locations" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "attendance_locations"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Backfill: preserve any tenant's already-configured single geofence as a
-- row in attendance_locations before the old columns are dropped below.
INSERT INTO "attendance_locations" ("id", "tenant_id", "name", "latitude", "longitude", "radius_meters", "created_at", "updated_at", "created_by", "updated_by")
SELECT gen_random_uuid(), "tenant_id", COALESCE("geofence_location_name", 'Default location'), "geofence_latitude", "geofence_longitude", "geofence_radius_meters", "created_at", "updated_at", "created_by", "updated_by"
FROM "attendance_policies"
WHERE "geofence_latitude" IS NOT NULL
  AND "geofence_longitude" IS NOT NULL
  AND "geofence_radius_meters" IS NOT NULL;

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "clock_in_location_name" TEXT,
ADD COLUMN     "clock_out_location_name" TEXT;

-- AlterTable
ALTER TABLE "attendance_policies" DROP COLUMN "geofence_latitude",
DROP COLUMN "geofence_location_name",
DROP COLUMN "geofence_longitude",
DROP COLUMN "geofence_radius_meters";
