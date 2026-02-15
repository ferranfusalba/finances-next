"use server";

import * as z from "zod";
import { ResetSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const limiter = createRateLimiter({
  name: "reset",
  interval: 60_000,
  maxRequests: 3,
});

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const ip = await getClientIp();
  const { success: allowed } = limiter.check(ip);
  if (!allowed) {
    return { error: "Too many requests. Please try again later." };
  }

  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email" };
  }

  const { email } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  // Return same message regardless of whether email exists to prevent enumeration
  if (!existingUser) {
    return { success: "Reset email sent" };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token
  );

  return { success: "Reset email sent" };
};
