import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
} from "./verification-token";

describe("getVerificationTokenByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token when found", async () => {
    const mockToken = {
      id: "1",
      token: "verify-123",
      email: "user@example.com",
      expires: new Date(),
    };
    vi.mocked(db.verificationToken.findUnique).mockResolvedValue(
      mockToken as never
    );

    const result = await getVerificationTokenByToken("verify-123");

    expect(result).toEqual(mockToken);
    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: "verify-123" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.verificationToken.findUnique).mockRejectedValue(
      new Error("DB error")
    );

    const result = await getVerificationTokenByToken("verify-123");

    expect(result).toBeNull();
  });
});

describe("getVerificationTokenByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token when found", async () => {
    const mockToken = {
      id: "1",
      token: "verify-123",
      email: "user@example.com",
      expires: new Date(),
    };
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue(
      mockToken as never
    );

    const result = await getVerificationTokenByEmail("user@example.com");

    expect(result).toEqual(mockToken);
    expect(db.verificationToken.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.verificationToken.findFirst).mockRejectedValue(
      new Error("DB error")
    );

    const result = await getVerificationTokenByEmail("user@example.com");

    expect(result).toBeNull();
  });
});
