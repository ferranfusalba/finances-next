"use server";

import * as z from "zod";

import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { generateVerificationToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { decryptSecret, verifyTotpCode } from "@/lib/totp";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const limiter = createRateLimiter({
  name: "login",
  interval: 60_000,
  maxRequests: 5,
});

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const ip = await getClientIp();
  const { success: allowed } = limiter.check(ip);
  if (!allowed) {
    return { error: "Too many requests. Please try again later." };
  }

  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return { success: "Confirmation email sent" };
  }

  // Two-factor authentication check
  if (existingUser.twoFactorEnabled && existingUser.totpSecret) {
    if (!code) {
      return { twoFactor: true };
    }

    const secret = decryptSecret(existingUser.totpSecret);
    const isValidTotp = verifyTotpCode(secret, code);

    if (!isValidTotp) {
      // Try backup codes
      const backupCodes = await db.twoFactorBackupCode.findMany({
        where: { userId: existingUser.id },
      });

      let backupMatch = false;
      for (const backupCode of backupCodes) {
        const match = await bcrypt.compare(code, backupCode.code);
        if (match) {
          await db.twoFactorBackupCode.delete({
            where: { id: backupCode.id },
          });
          backupMatch = true;
          break;
        }
      }

      if (!backupMatch) {
        return { error: "Invalid code" };
      }
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials! " };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};
