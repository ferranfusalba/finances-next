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

  // Prompt for a two-factor code when needed. The code itself is verified in
  // the credentials `authorize()` callback (the actual security boundary), so
  // it is passed through to `signIn` below rather than checked here.
  if (existingUser.twoFactorEnabled && existingUser.totpSecret && !code) {
    return { twoFactor: true };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      code,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // authorize() returns null for a bad password or a bad 2FA code.
          if (existingUser.twoFactorEnabled && code) {
            return { error: "Invalid code" };
          }
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};
