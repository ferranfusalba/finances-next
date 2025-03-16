-- CreateTable
CREATE TABLE "UserTransactionPayee" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserTransactionPayee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactionPayee_name_key" ON "UserTransactionPayee"("name");

-- AddForeignKey
ALTER TABLE "UserTransactionPayee" ADD CONSTRAINT "UserTransactionPayee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
