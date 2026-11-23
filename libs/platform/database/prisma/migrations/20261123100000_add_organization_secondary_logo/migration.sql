-- A second, independent logo slot for an organization's invoices - e.g. an
-- IATA/accreditation mark shown opposite the organization's own logo, with
-- its address centered between them. Same nullable, optional-by-default
-- shape as the existing logo_storage_key column.
ALTER TABLE "organizations" ADD COLUMN "secondary_logo_storage_key" TEXT;
