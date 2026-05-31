-- CreateTable
CREATE TABLE "Event" (
    "event_id" TEXT NOT NULL PRIMARY KEY,
    "store_id" TEXT NOT NULL,
    "camera_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "zone_id" TEXT,
    "dwell_ms" INTEGER NOT NULL,
    "is_staff" BOOLEAN NOT NULL,
    "confidence" REAL NOT NULL,
    "metadata" JSON NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PosTransaction" (
    "transaction_id" TEXT NOT NULL PRIMARY KEY,
    "store_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "basket_value" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Event_store_id_timestamp_idx" ON "Event"("store_id", "timestamp");

-- CreateIndex
CREATE INDEX "Event_visitor_id_idx" ON "Event"("visitor_id");

-- CreateIndex
CREATE INDEX "PosTransaction_store_id_timestamp_idx" ON "PosTransaction"("store_id", "timestamp");
