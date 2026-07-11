import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/schemas";

import type { NextAuthConfig } from "next-auth";
import { getUserByEmail } from "./data/user";
import { db } from "@/lib/db";
import { decryptSecret, verifyTotpCode } from "@/lib/totp";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) return null;

        const { email, password, code } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Enforce two-factor here — this is the security boundary. The login
        // server action only decides whether to *prompt* for a code; it must
        // not be the only place 2FA is checked, or the credentials endpoint
        // could be called directly to bypass it.
        if (user.twoFactorEnabled && user.totpSecret) {
          if (!code) return null;

          const secret = decryptSecret(user.totpSecret);
          const isValidTotp = verifyTotpCode(secret, code);

          if (!isValidTotp) {
            // Fall back to single-use backup codes.
            const backupCodes = await db.twoFactorBackupCode.findMany({
              where: { userId: user.id },
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

            if (!backupMatch) return null;
          }
        }

        return user;
      },
    }),
  ],
} satisfies NextAuthConfig;
