-- AlterTable
ALTER TABLE "attendance_policies"
  ADD COLUMN "geofence_latitude" DECIMAL(65,30),
  ADD COLUMN "geofence_longitude" DECIMAL(65,30),
  ADD COLUMN "geofence_radius_meters" INTEGER;

-- AlterTable
ALTER TABLE "attendance_records"
  ADD COLUMN "clock_in_latitude" DECIMAL(65,30),
  ADD COLUMN "clock_in_longitude" DECIMAL(65,30),
  ADD COLUMN "clock_in_distance_meters" INTEGER,
  ADD COLUMN "clock_in_outside_geofence" BOOLEAN,
  ADD COLUMN "clock_out_latitude" DECIMAL(65,30),
  ADD COLUMN "clock_out_longitude" DECIMAL(65,30),
  ADD COLUMN "clock_out_distance_meters" INTEGER,
  ADD COLUMN "clock_out_outside_geofence" BOOLEAN;
