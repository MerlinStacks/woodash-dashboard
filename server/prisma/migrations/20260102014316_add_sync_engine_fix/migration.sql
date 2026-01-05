-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "cursor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WooOrder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "rawData" JSONB NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "dateModified" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WooOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WooProduct" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2),
    "stockStatus" TEXT,
    "permalink" TEXT,
    "mainImage" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WooProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WooCustomer" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "totalSpent" DECIMAL(10,2) NOT NULL,
    "ordersCount" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WooCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WooReview" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT,
    "reviewer" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WooReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_accountId_entityType_key" ON "SyncState"("accountId", "entityType");

-- CreateIndex
CREATE INDEX "SyncLog_accountId_startedAt_idx" ON "SyncLog"("accountId", "startedAt");

-- CreateIndex
CREATE INDEX "WooOrder_accountId_dateCreated_idx" ON "WooOrder"("accountId", "dateCreated");

-- CreateIndex
CREATE UNIQUE INDEX "WooOrder_accountId_wooId_key" ON "WooOrder"("accountId", "wooId");

-- CreateIndex
CREATE UNIQUE INDEX "WooProduct_accountId_wooId_key" ON "WooProduct"("accountId", "wooId");

-- CreateIndex
CREATE INDEX "WooCustomer_accountId_email_idx" ON "WooCustomer"("accountId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "WooCustomer_accountId_wooId_key" ON "WooCustomer"("accountId", "wooId");

-- CreateIndex
CREATE UNIQUE INDEX "WooReview_accountId_wooId_key" ON "WooReview"("accountId", "wooId");

-- AddForeignKey
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WooOrder" ADD CONSTRAINT "WooOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WooProduct" ADD CONSTRAINT "WooProduct_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WooCustomer" ADD CONSTRAINT "WooCustomer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WooReview" ADD CONSTRAINT "WooReview_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
