import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_EMAIL_PREFIX = "e2e-test-";

export function testEmail(suffix: string) {
  return `${TEST_EMAIL_PREFIX}${suffix}@example.com`;
}

export async function resetTestData() {
  // Delete all test users and their cascading data
  const testUsers = await prisma.user.findMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
    select: { id: true, email: true },
  });

  for (const user of testUsers) {
    // Delete account transactions for user's accounts
    await prisma.accountTransaction.deleteMany({
      where: { Account: { userId: user.id } },
    });

    // Delete budget transactions for user's budgets
    await prisma.budgetTransaction.deleteMany({
      where: { Budget: { userId: user.id } },
    });

    // Delete accounts and budgets
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.budget.deleteMany({ where: { userId: user.id } });

    // Delete user's payees, categories, subcategories
    const categories = await prisma.userTransactionCategory.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    for (const cat of categories) {
      await prisma.userTransactionSubcategory.deleteMany({
        where: { categoryId: cat.id },
      });
    }
    await prisma.userTransactionCategory.deleteMany({
      where: { userId: user.id },
    });
    await prisma.userTransactionPayee.deleteMany({
      where: { userId: user.id },
    });

    // Delete tokens for this email
    if (user.email) {
      await prisma.verificationToken.deleteMany({
        where: { email: user.email },
      });
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      });
    }

    // Delete user accounts (OAuth) and then the user
    await prisma.userAccount.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Also clean up any orphaned tokens for test emails
  await prisma.verificationToken.deleteMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
  });
  await prisma.passwordResetToken.deleteMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
  });
}

export async function seedVerifiedUser(
  email: string,
  password: string,
  name = "E2E Test User"
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });
}

export async function createTestAccount(
  userId: string,
  overrides: Partial<{
    name: string;
    code: string;
    bankName: string;
    type: string;
    defaultCurrency: string;
    country: string;
  }> = {}
) {
  return prisma.account.create({
    data: {
      name: overrides.name ?? "Test Account",
      code: overrides.code ?? `TST-${Date.now()}`,
      bankName: overrides.bankName ?? "Test Bank",
      active: true,
      type: overrides.type ?? "Checking",
      defaultCurrency: overrides.defaultCurrency ?? "EUR",
      country: overrides.country ?? "ES",
      userId,
    },
  });
}

export async function createTestBudget(
  userId: string,
  overrides: Partial<{
    name: string;
    code: string;
    type: string;
    defaultCurrency: string;
    initialBalance: number;
  }> = {}
) {
  return prisma.budget.create({
    data: {
      name: overrides.name ?? "Test Budget",
      code: overrides.code ?? `BDG-${Date.now()}`,
      active: true,
      type: overrides.type ?? "Monthly",
      defaultCurrency: overrides.defaultCurrency ?? "EUR",
      initialBalance: overrides.initialBalance ?? 1000,
      userId,
    },
  });
}

export async function directlyVerifyEmail(email: string) {
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });
}

export { prisma };
