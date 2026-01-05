-- AlterTable
ALTER TABLE "MarketingAutomation" ADD COLUMN     "flowDefinition" JSONB DEFAULT '{}',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PAUSED';

-- AlterTable
ALTER TABLE "MarketingCampaign" ADD COLUMN     "designJson" JSONB;
