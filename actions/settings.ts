"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { SettingsSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { newPassword } from "./new-password";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user || !user.id) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id);

  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  const parsed = SettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Invalid fields!" };
  }

  const data = parsed.data;

  if (user.isOAuth) {
    data.email = undefined;
    data.password = undefined;
    data.newPassword = undefined;
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await getUserByEmail(data.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use" };
    }

    const verificationToken = await generateVerificationToken(data.email);

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return { success: "Verification email sent" };
  }

  let hashedPassword: string | undefined;
  let passwordChanged = false;

  if (data.password && data.newPassword && dbUser.password) {
    const passwordMatch = await bcrypt.compare(
      data.password,
      dbUser.password
    );

    if (!passwordMatch) {
      return { error: "Incorrect password" };
    }

    hashedPassword = await bcrypt.hash(data.newPassword, 10);
    passwordChanged = true;
  }

  // Explicit allow-list: never spread client input into the update. This
  // prevents mass-assignment of privileged fields (role, twoFactorEnabled,
  // emailVerified, or a plaintext password).
  await db.user.update({
    where: { id: dbUser.id },
    data: {
      name: data.name,
      userCountry: data.userCountry,
      userCurrency: data.userCurrency,
      userTimezone: data.userTimezone,
      userLocale: data.userLocale,
      weekStartsOn: data.weekStartsOn,
      ...(hashedPassword ? { password: hashedPassword } : {}),
      preferencesSet: true,
    },
  });

  if (passwordChanged) {
    return { success: "Password updated. Please log in again.", passwordChanged: true as const };
  }

  return { success: "Settings Updated" };
};
