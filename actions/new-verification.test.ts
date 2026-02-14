import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { update: vi.fn() },
    verificationToken: { delete: vi.fn() },
  },
}));

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/data/verification-token", () => ({
  getVerificationTokenByToken: vi.fn(),
}));

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { newVerification } from "./new-verification";

describe("newVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when token does not exist", async () => {
    vi.mocked(getVerificationTokenByToken).mockResolvedValue(null);

    const result = await newVerification("bad-token");

    expect(result).toEqual({ error: "Token does not exist" });
  });

  it("returns error when token has expired", async () => {
    vi.mocked(getVerificationTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "valid-token",
      expires: new Date(Date.now() - 60_000), // 1 minute ago
    });

    const result = await newVerification("valid-token");

    expect(result).toEqual({ error: "Token has expired" });
  });

  it("returns error when user does not exist", async () => {
    vi.mocked(getVerificationTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "ghost@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600_000),
    });
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const result = await newVerification("valid-token");

    expect(result).toEqual({ error: "Email does not exist" });
  });

  it("verifies email, updates user, and deletes token", async () => {
    vi.mocked(getVerificationTokenByToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600_000),
    });
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(db.verificationToken.delete).mockResolvedValue({} as never);

    const result = await newVerification("valid-token");

    expect(result).toEqual({ success: "Email verified" });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        emailVerified: expect.any(Date),
        email: "user@example.com",
      },
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { id: "tok-1" },
    });
  });
});
