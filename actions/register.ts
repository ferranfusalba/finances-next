"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { detectCountry } from "@/lib/utils/geo";

const limiter = createRateLimiter({
  name: "register",
  interval: 60_000,
  maxRequests: 3,
});

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  if (process.env.REGISTRATION_DISABLED === "true") {
    return { error: "Registration is currently disabled" };
  }

  const ip = await getClientIp();
  const { success: allowed } = limiter.check(ip);
  if (!allowed) {
    return { error: "Too many requests. Please try again later." };
  }

  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, userTimezone, userLocale } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userCountry = await detectCountry();

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      userCountry,
      userCurrency: "EUR",
      userTimezone: userTimezone ?? "",
      userLocale: userLocale ?? "",
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: "Confirmation email sent!" };
};
