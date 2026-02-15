-- CreateTable
CREATE TABLE "TaxLine" (
    "id" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "inclusive" BOOLEAN NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "accountTransactionId" TEXT NOT NULL,

    CONSTRAINT "TaxLine_pkey" PRIMARY KEY ("id")
);

-- Migrate existing JSON data to the new table
INSERT INTO "TaxLine" ("id", "rate", "amount", "inclusive", "taxAmount", "accountTransactionId")
SELECT
    gen_random_uuid()::text,
    (line->>'rate')::decimal,
    (line->>'amount')::decimal,
    (line->>'inclusive')::boolean,
    (line->>'taxAmount')::decimal,
    "id"
FROM "AccountTransaction",
    jsonb_array_elements("taxLines") AS line
WHERE "taxLines" IS NOT NULL;

-- AlterTable
ALTER TABLE "AccountTransaction" DROP COLUMN "taxLines";

-- AddForeignKey
ALTER TABLE "TaxLine" ADD CONSTRAINT "TaxLine_accountTransactionId_fkey" FOREIGN KEY ("accountTransactionId") REFERENCES "AccountTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
