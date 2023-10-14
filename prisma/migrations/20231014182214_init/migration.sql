/*
  Warnings:

  - Made the column `updatedAt` on table `Account` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN,
    "type" INTEGER,
    "description" TEXT,
    "initialBalance" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Account" ("active", "createdAt", "description", "id", "initialBalance", "name", "type", "updatedAt") SELECT "active", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "description", "id", "initialBalance", "name", "type", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
