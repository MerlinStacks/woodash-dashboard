/*
  Warnings:

  - You are about to drop the `ReviewRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReviewRequest" DROP CONSTRAINT "ReviewRequest_accountId_fkey";

-- DropTable
DROP TABLE "ReviewRequest";
