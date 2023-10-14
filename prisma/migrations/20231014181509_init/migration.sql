-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN,
    "type" INTEGER,
    "description" TEXT,
    "initialBalance" DECIMAL,
    "createdAt" DATETIME,
    "updatedAt" DATETIME
);
INSERT INTO "new_Account" ("active", "createdAt", "description", "id", "initialBalance", "name", "type", "updatedAt") SELECT "active", "createdAt", "description", "id", "initialBalance", "name", "type", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
