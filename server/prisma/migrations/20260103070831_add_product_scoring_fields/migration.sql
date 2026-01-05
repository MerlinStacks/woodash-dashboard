-- AlterTable
ALTER TABLE "WooProduct" ADD COLUMN     "merchantCenterIssues" JSONB DEFAULT '[]',
ADD COLUMN     "merchantCenterScore" INTEGER DEFAULT 0,
ADD COLUMN     "seoData" JSONB DEFAULT '{}',
ADD COLUMN     "seoScore" INTEGER DEFAULT 0;
