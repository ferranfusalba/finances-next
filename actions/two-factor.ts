"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getUserById } from "@/data/user";
import { TwoFactorSetupSchema } from "@/schemas";
import {
  generateTotpSecret,
  encryptSecret,
  decryptSecret,
  verifyTotpCode,
  generateBackupCodes,
  generateQrDataUri,
} from "@/lib/totp";

export const setupTwoFactor = async () => {
  const user = await currentUser();
  if (!user?.id) return { error: "Unauthorized" };

  const dbUser = await getUserById(user.id);
  if (!dbUser) return { error: "Unauthorized" };

  if (dbUser.twoFactorEnabled) {
    return { error: "Two-factor authentication is already enabled" };
  }

  const { secret, uri } = generateTotpSecret(dbUser.email ?? "");
  const encryptedSecret = encryptSecret(secret);

  // Store encrypted secret (but don't enable 2FA yet)
  await db.user.update({
    where: { id: dbUser.id },
    data: { totpSecret: encryptedSecret },
  });

  // Generate and store backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(
    backupCodes.map((code) => bcrypt.hash(code, 10))
  );

  // Delete any existing backup codes
  await db.twoFactorBackupCode.deleteMany({ where: { userId: dbUser.id } });

  // Store hashed backup codes
  await db.twoFactorBackupCode.createMany({
    data: hashedCodes.map((code) => ({
      userId: dbUser.id,
      code,
    })),
  });

  const qrCode = await generateQrDataUri(uri);

  return { qrCode, secret, backupCodes };
};

export const confirmTwoFactor = async (
  values: z.infer<typeof TwoFactorSetupSchema>
) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Unauthorized" };

  const dbUser = await getUserById(user.id);
  if (!dbUser) return { error: "Unauthorized" };

  if (!dbUser.totpSecret) {
    return { error: "Two-factor setup not initiated" };
  }

  if (dbUser.twoFactorEnabled) {
    return { error: "Two-factor authentication is already enabled" };
  }

  const validatedFields = TwoFactorSetupSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid code" };
  }

  const secret = decryptSecret(dbUser.totpSecret);
  const isValid = verifyTotpCode(secret, validatedFields.data.code);

  if (!isValid) {
    return { error: "Invalid code" };
  }

  await db.user.update({
    where: { id: dbUser.id },
    data: { twoFactorEnabled: true },
  });

  return { success: "Two-factor authentication enabled" };
};

export const disableTwoFactor = async (values: { password: string }) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Unauthorized" };

  const dbUser = await getUserById(user.id);
  if (!dbUser) return { error: "Unauthorized" };

  if (!dbUser.twoFactorEnabled) {
    return { error: "Two-factor authentication is not enabled" };
  }

  if (!dbUser.password) {
    return { error: "Password verification required" };
  }

  const passwordMatch = await bcrypt.compare(values.password, dbUser.password);
  if (!passwordMatch) {
    return { error: "Incorrect password" };
  }

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      twoFactorEnabled: false,
      totpSecret: null,
    },
  });

  await db.twoFactorBackupCode.deleteMany({ where: { userId: dbUser.id } });

  return { success: "Two-factor authentication disabled" };
};
