/*
  Warnings:

  - Added the required column `type` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "type" INTEGER NOT NULL,
    "description" TEXT,
    "initialBalance" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Account" ("active", "createdAt", "description", "id", "initialBalance", "name", "updatedAt") SELECT "active", "createdAt", "description", "id", "initialBalance", "name", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
