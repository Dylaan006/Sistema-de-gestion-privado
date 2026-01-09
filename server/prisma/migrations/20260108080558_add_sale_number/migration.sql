-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'B',
    "cae" TEXT,
    "caeExpiration" DATETIME,
    "invoiceNumber" INTEGER,
    "userId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "relatedSaleId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_relatedSaleId_fkey" FOREIGN KEY ("relatedSaleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("cae", "caeExpiration", "clientId", "createdAt", "date", "id", "invoiceNumber", "invoiceType", "organizationId", "relatedSaleId", "total", "updatedAt", "userId") SELECT "cae", "caeExpiration", "clientId", "createdAt", "date", "id", "invoiceNumber", "invoiceType", "organizationId", "relatedSaleId", "total", "updatedAt", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_organizationId_invoiceType_number_key" ON "Sale"("organizationId", "invoiceType", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
