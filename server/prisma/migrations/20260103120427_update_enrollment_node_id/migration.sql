/*
  Warnings:

  - You are about to drop the column `currentStepIdx` on the `AutomationEnrollment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AutomationEnrollment" DROP COLUMN "currentStepIdx",
ADD COLUMN     "currentNodeId" TEXT;
