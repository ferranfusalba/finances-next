import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { update: vi.fn() },
    passwordResetToken: { delete: vi.fn() },
  },
}));

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/data/password-reset-token", () => ({
  getPasswordResetTokenByToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(() => "hashed-password") },
}));

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { newPassword } from "./new-password";

describe("newPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when token is missing", async () => {
    const result = await newPassword({ password: "newpass123" }, null);

    expect(result).toEqual({ error: "Missing token" });
  });

  it("returns error when token is undefined", async () => {
    const result = await newPassword({ password: "newpass123" }, undefined);

    expect(result).toEqual({ error: "Missing token" });
  });

  it("returns error for invalid fields", async () => {
    const result = await newPassword({ password: "short" }, "some-token");

    expect(result).toEqual({ error: "Invalid fields" });
  });

  it("returns error when token does not exist in DB", async () => {
    vi.mocked(getPasswordResetTokenByToken).mockResolvedValue(null);

    const result = await newPassword({ password: "newpass123" }, "bad-token");

    expect(result).toEqual({ error: "Invalid token" });
  });

  it("returns error when token has expired", async () => {
    vi.mocked(getPasswordResetTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "expired-token",
      expires: new Date(Date.now() - 60_000),
    });

    const result = await newPassword(
      { password: "newpass123" },
      "expired-token"
    );

    expect(result).toEqual({ error: "Token has expired" });
  });

  it("returns error when user does not exist", async () => {
    vi.mocked(getPasswordResetTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "ghost@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 300_000),
    });
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const result = await newPassword({ password: "newpass123" }, "valid-token");

    expect(result).toEqual({ error: "Email does not exist" });
  });

  it("hashes password, updates user, and deletes token on success", async () => {
    vi.mocked(getPasswordResetTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 300_000),
    });
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(db.passwordResetToken.delete).mockResolvedValue({} as never);

    const result = await newPassword({ password: "newpass123" }, "valid-token");

    expect(result).toEqual({ success: "Password updated" });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "hashed-password" },
    });
    expect(db.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: "tok-1" },
    });
  });
});
