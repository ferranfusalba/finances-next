import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { update: vi.fn() },
    twoFactorBackupCode: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/data/user", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/lib/totp", () => ({
  generateTotpSecret: vi.fn(() => ({
    secret: "JBSWY3DPEHPK3PXP",
    uri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP",
  })),
  encryptSecret: vi.fn(() => "encrypted-secret"),
  decryptSecret: vi.fn(() => "JBSWY3DPEHPK3PXP"),
  verifyTotpCode: vi.fn(),
  generateBackupCodes: vi.fn(() => [
    "code0001",
    "code0002",
    "code0003",
    "code0004",
    "code0005",
    "code0006",
    "code0007",
    "code0008",
    "code0009",
    "code0010",
  ]),
  generateQrDataUri: vi.fn(() => "data:image/png;base64,abc"),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => "hashed-code"),
    compare: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getUserById } from "@/data/user";
import { verifyTotpCode } from "@/lib/totp";
import {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "./two-factor";

describe("setupTwoFactor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const result = await setupTwoFactor();
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns error when 2FA is already enabled", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      twoFactorEnabled: true,
    } as never);

    const result = await setupTwoFactor();
    expect(result).toEqual({
      error: "Two-factor authentication is already enabled",
    });
  });

  it("generates QR code and backup codes on success", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      twoFactorEnabled: false,
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(db.twoFactorBackupCode.deleteMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(db.twoFactorBackupCode.createMany).mockResolvedValue({
      count: 10,
    });

    const result = await setupTwoFactor();

    expect(result).toHaveProperty("qrCode");
    expect(result).toHaveProperty("backupCodes");
    if ("backupCodes" in result) {
      expect(result.backupCodes).toHaveLength(10);
    }
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { totpSecret: "encrypted-secret" },
    });
  });
});

describe("confirmTwoFactor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const result = await confirmTwoFactor({ code: "123456" });
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns error when setup not initiated", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      totpSecret: null,
      twoFactorEnabled: false,
    } as never);

    const result = await confirmTwoFactor({ code: "123456" });
    expect(result).toEqual({ error: "Two-factor setup not initiated" });
  });

  it("returns error for invalid code", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      totpSecret: "encrypted",
      twoFactorEnabled: false,
    } as never);
    vi.mocked(verifyTotpCode).mockReturnValue(false);

    const result = await confirmTwoFactor({ code: "000000" });
    expect(result).toEqual({ error: "Invalid code" });
  });

  it("enables 2FA on valid code", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      totpSecret: "encrypted",
      twoFactorEnabled: false,
    } as never);
    vi.mocked(verifyTotpCode).mockReturnValue(true);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const result = await confirmTwoFactor({ code: "123456" });
    expect(result).toEqual({
      success: "Two-factor authentication enabled",
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { twoFactorEnabled: true },
    });
  });
});

describe("disableTwoFactor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const result = await disableTwoFactor({ password: "pass" });
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns error when 2FA is not enabled", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      twoFactorEnabled: false,
    } as never);

    const result = await disableTwoFactor({ password: "pass" });
    expect(result).toEqual({
      error: "Two-factor authentication is not enabled",
    });
  });

  it("returns error for incorrect password", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      twoFactorEnabled: true,
      password: "hashed",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await disableTwoFactor({ password: "wrong" });
    expect(result).toEqual({ error: "Incorrect password" });
  });

  it("disables 2FA and clears data on success", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      twoFactorEnabled: true,
      password: "hashed",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(db.twoFactorBackupCode.deleteMany).mockResolvedValue({
      count: 10,
    });

    const result = await disableTwoFactor({ password: "correct" });
    expect(result).toEqual({
      success: "Two-factor authentication disabled",
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { twoFactorEnabled: false, totpSecret: null },
    });
    expect(db.twoFactorBackupCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });
});
