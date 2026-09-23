-- AlterTable
ALTER TABLE "gl_journal_entries" ADD COLUMN     "voided_at" TIMESTAMP(3),
ADD COLUMN     "voided_by" TEXT,
ADD COLUMN     "reversal_of_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "gl_journal_entries_reversal_of_id_key" ON "gl_journal_entries"("reversal_of_id");

-- AddForeignKey
ALTER TABLE "gl_journal_entries" ADD CONSTRAINT "gl_journal_entries_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "gl_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
