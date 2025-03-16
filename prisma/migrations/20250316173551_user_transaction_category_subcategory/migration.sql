-- CreateTable
CREATE TABLE "UserTransactionCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserTransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategorySubcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userTransactionCategoryId" TEXT,

    CONSTRAINT "TransactionCategorySubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactionCategory_name_key" ON "UserTransactionCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategorySubcategory_name_key" ON "TransactionCategorySubcategory"("name");

-- AddForeignKey
ALTER TABLE "UserTransactionCategory" ADD CONSTRAINT "UserTransactionCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCategorySubcategory" ADD CONSTRAINT "TransactionCategorySubcategory_userTransactionCategoryId_fkey" FOREIGN KEY ("userTransactionCategoryId") REFERENCES "UserTransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
