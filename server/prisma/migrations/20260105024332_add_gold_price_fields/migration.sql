-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "goldPrice" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "goldPriceCurrency" TEXT DEFAULT 'USD';

-- AlterTable
ALTER TABLE "MarketingCampaign" ADD COLUMN     "segmentId" TEXT;

-- AlterTable
ALTER TABLE "WooProduct" ADD COLUMN     "height" DECIMAL(10,2),
ADD COLUMN     "isGoldPriceApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "length" DECIMAL(10,2),
ADD COLUMN     "weight" DECIMAL(10,4),
ADD COLUMN     "width" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "WooReview" ADD COLUMN     "reviewerEmail" TEXT,
ADD COLUMN     "wooCustomerId" TEXT,
ADD COLUMN     "wooOrderId" TEXT;

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegment_accountId_name_key" ON "CustomerSegment"("accountId", "name");

-- AddForeignKey
ALTER TABLE "WooReview" ADD CONSTRAINT "WooReview_wooCustomerId_fkey" FOREIGN KEY ("wooCustomerId") REFERENCES "WooCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WooReview" ADD CONSTRAINT "WooReview_wooOrderId_fkey" FOREIGN KEY ("wooOrderId") REFERENCES "WooOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSegment" ADD CONSTRAINT "CustomerSegment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
