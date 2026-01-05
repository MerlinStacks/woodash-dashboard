-- CreateTable
CREATE TABLE "AdAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdAccount_accountId_idx" ON "AdAccount"("accountId");

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
