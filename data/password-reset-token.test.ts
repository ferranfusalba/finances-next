import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  getPasswordResetTokenByToken,
  getPasswordResetTokenByEmail,
} from "./password-reset-token";

describe("getPasswordResetTokenByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token when found", async () => {
    const mockToken = {
      id: "1",
      token: "abc-123",
      email: "user@example.com",
      expires: new Date(),
    };
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(
      mockToken as never
    );

    const result = await getPasswordResetTokenByToken("abc-123");

    expect(result).toEqual(mockToken);
    expect(db.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { token: "abc-123" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.passwordResetToken.findUnique).mockRejectedValue(
      new Error("DB error")
    );

    const result = await getPasswordResetTokenByToken("abc-123");

    expect(result).toBeNull();
  });
});

describe("getPasswordResetTokenByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token when found", async () => {
    const mockToken = {
      id: "1",
      token: "abc-123",
      email: "user@example.com",
      expires: new Date(),
    };
    vi.mocked(db.passwordResetToken.findFirst).mockResolvedValue(
      mockToken as never
    );

    const result = await getPasswordResetTokenByEmail("user@example.com");

    expect(result).toEqual(mockToken);
    expect(db.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.passwordResetToken.findFirst).mockRejectedValue(
      new Error("DB error")
    );

    const result = await getPasswordResetTokenByEmail("user@example.com");

    expect(result).toBeNull();
  });
});
