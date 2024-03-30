-- CreateTable
CREATE TABLE "TypeTransfer" (
    "originAccountId" TEXT NOT NULL,
    "destinationAccountId" TEXT NOT NULL,

    CONSTRAINT "TypeTransfer_pkey" PRIMARY KEY ("originAccountId")
);

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_id_fkey" FOREIGN KEY ("id") REFERENCES "TypeTransfer"("originAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;
