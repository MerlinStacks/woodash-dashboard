-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "appearance" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "WooProduct" ADD COLUMN     "binLocation" TEXT;
