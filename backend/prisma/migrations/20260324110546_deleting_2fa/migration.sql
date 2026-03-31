/*
  Warnings:

  - You are about to drop the column `two_factor_enabled` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `two_factor_secret` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "two_factor_enabled",
DROP COLUMN "two_factor_secret";
