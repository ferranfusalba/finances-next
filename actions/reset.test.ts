import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generatePasswordResetToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => ({ check: () => ({ success: true }) }),
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { reset } from "./reset";

describe("reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid email", async () => {
    const result = await reset({ email: "not-an-email" });

    expect(result).toEqual({ error: "Invalid email" });
  });

  it("returns success even when user does not exist (prevents enumeration)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const result = await reset({ email: "ghost@example.com" });

    expect(result).toEqual({ success: "Reset email sent" });
    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("generates token and sends reset email on success", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(generatePasswordResetToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "reset-token",
      expires: new Date(),
    });

    const result = await reset({ email: "user@example.com" });

    expect(result).toEqual({ success: "Reset email sent" });
    expect(generatePasswordResetToken).toHaveBeenCalledWith(
      "user@example.com"
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      "reset-token"
    );
  });
});
