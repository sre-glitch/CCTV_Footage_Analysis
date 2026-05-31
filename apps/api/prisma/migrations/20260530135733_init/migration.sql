-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
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
    "metadata" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("camera_id", "confidence", "created_at", "dwell_ms", "event_id", "event_type", "is_staff", "metadata", "store_id", "timestamp", "visitor_id", "zone_id") SELECT "camera_id", "confidence", "created_at", "dwell_ms", "event_id", "event_type", "is_staff", "metadata", "store_id", "timestamp", "visitor_id", "zone_id" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_store_id_timestamp_idx" ON "Event"("store_id", "timestamp");
CREATE INDEX "Event_visitor_id_idx" ON "Event"("visitor_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
