/*
  Warnings:

  - Added the required column `currency` to the `gl_journal_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gl_journal_entries" ADD COLUMN     "currency" TEXT NOT NULL;
