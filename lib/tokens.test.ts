import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: {
      delete: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/data/password-reset-token", () => ({
  getPasswordResetTokenByEmail: vi.fn(),
}));

vi.mock("@/data/verification-token", () => ({
  getVerificationTokenByEmail: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-token"),
}));

import { db } from "@/lib/db";
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import {
  generatePasswordResetToken,
  generateVerificationToken,
} from "./tokens";

describe("generatePasswordResetToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new token with 5-minute expiry", async () => {
    vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue(null);
    vi.mocked(db.passwordResetToken.create).mockResolvedValue({
      id: "1",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    const before = Date.now();
    await generatePasswordResetToken("user@example.com");
    const after = Date.now();

    expect(db.passwordResetToken.create).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(db.passwordResetToken.create).mock.calls[0][0];
    expect(callArgs.data.email).toBe("user@example.com");
    expect(callArgs.data.token).toBe("mock-uuid-token");

    const expiresMs = (callArgs.data.expires as Date).getTime();
    // Expiry should be ~5 minutes (300_000ms) from now
    expect(expiresMs).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 100);
    expect(expiresMs).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 100);
  });

  it("deletes existing token before creating new one", async () => {
    vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue({
      id: "old-token-id",
      email: "user@example.com",
      token: "old-token",
      expires: new Date(),
    });
    vi.mocked(db.passwordResetToken.create).mockResolvedValue({
      id: "2",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    await generatePasswordResetToken("user@example.com");

    expect(db.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: "old-token-id" },
    });
    expect(db.passwordResetToken.create).toHaveBeenCalledOnce();
  });

  it("skips deletion when no existing token", async () => {
    vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue(null);
    vi.mocked(db.passwordResetToken.create).mockResolvedValue({
      id: "1",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    await generatePasswordResetToken("user@example.com");

    expect(db.passwordResetToken.delete).not.toHaveBeenCalled();
    expect(db.passwordResetToken.create).toHaveBeenCalledOnce();
  });
});

describe("generateVerificationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new token with 1-hour expiry", async () => {
    vi.mocked(getVerificationTokenByEmail).mockResolvedValue(null);
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      id: "1",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    const before = Date.now();
    await generateVerificationToken("user@example.com");
    const after = Date.now();

    expect(db.verificationToken.create).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(db.verificationToken.create).mock.calls[0][0];
    expect(callArgs.data.email).toBe("user@example.com");
    expect(callArgs.data.token).toBe("mock-uuid-token");

    const expiresMs = (callArgs.data.expires as Date).getTime();
    // Expiry should be ~1 hour (3_600_000ms) from now
    expect(expiresMs).toBeGreaterThanOrEqual(before + 3600 * 1000 - 100);
    expect(expiresMs).toBeLessThanOrEqual(after + 3600 * 1000 + 100);
  });

  it("deletes existing token before creating new one", async () => {
    vi.mocked(getVerificationTokenByEmail).mockResolvedValue({
      id: "old-token-id",
      email: "user@example.com",
      token: "old-token",
      expires: new Date(),
    });
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      id: "2",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    await generateVerificationToken("user@example.com");

    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { id: "old-token-id" },
    });
    expect(db.verificationToken.create).toHaveBeenCalledOnce();
  });

  it("skips deletion when no existing token", async () => {
    vi.mocked(getVerificationTokenByEmail).mockResolvedValue(null);
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      id: "1",
      email: "user@example.com",
      token: "mock-uuid-token",
      expires: new Date(),
    });

    await generateVerificationToken("user@example.com");

    expect(db.verificationToken.delete).not.toHaveBeenCalled();
    expect(db.verificationToken.create).toHaveBeenCalledOnce();
  });
});
