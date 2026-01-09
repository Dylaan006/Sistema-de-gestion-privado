-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cuit" TEXT,
    "taxCondition" TEXT,
    "afipCrt" TEXT,
    "afipKey" TEXT,
    "salesPoint" INTEGER NOT NULL DEFAULT 1,
    "grossIncome" TEXT,
    "startActivity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("createdAt", "cuit", "id", "name", "taxCondition", "updatedAt") SELECT "createdAt", "cuit", "id", "name", "taxCondition", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
