import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generateVerificationToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => ({ check: () => ({ success: true }) }),
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/totp", () => ({
  decryptSecret: vi.fn(() => "JBSWY3DPEHPK3PXP"),
  verifyTotpCode: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  db: {
    twoFactorBackupCode: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/routes", () => ({
  DEFAULT_LOGIN_REDIRECT: "/",
}));

vi.mock("next-auth", () => {
  class AuthError extends Error {
    type: string;
    constructor(type = "Unknown") {
      super(type);
      this.type = type;
    }
  }
  return { AuthError };
});

import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { verifyTotpCode } from "@/lib/totp";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { login } from "./login";

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid fields", async () => {
    const result = await login({ email: "bad", password: "" });

    expect(result).toEqual({ error: "Invalid fields!" });
  });

  it("returns error when user does not exist", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const result = await login({
      email: "ghost@example.com",
      password: "password123",
    });

    expect(result).toEqual({ error: "Email does not exist" });
  });

  it("returns error when user has no password (OAuth user)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: null,
    } as never);

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ error: "Email does not exist" });
  });

  it("sends verification email when user is not verified", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: null,
    } as never);
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "tok-1",
      email: "user@example.com",
      token: "verify-token",
      expires: new Date(),
    });

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ success: "Confirmation email sent" });
    expect(generateVerificationToken).toHaveBeenCalledWith("user@example.com");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "user@example.com",
      "verify-token"
    );
  });

  it("calls signIn for verified user", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
    } as never);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/",
    });
  });

  it("returns error for CredentialsSignin AuthError", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
    } as never);

    const authError = new AuthError();
    authError.type = "CredentialsSignin";
    vi.mocked(signIn).mockRejectedValue(authError);

    const result = await login({
      email: "user@example.com",
      password: "wrong",
    });

    expect(result).toEqual({ error: "Invalid credentials! " });
  });

  it("returns generic error for other AuthError types", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
    } as never);

    const authError = new AuthError();
    authError.type = "AccessDenied";
    vi.mocked(signIn).mockRejectedValue(authError);

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ error: "Something went wrong!" });
  });

  it("rethrows non-AuthError errors", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
    } as never);

    vi.mocked(signIn).mockRejectedValue(new Error("Network failure"));

    await expect(
      login({ email: "user@example.com", password: "password123" })
    ).rejects.toThrow("Network failure");
  });

  it("returns twoFactor when 2FA enabled and no code provided", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
      twoFactorEnabled: true,
      totpSecret: "encrypted-secret",
    } as never);

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ twoFactor: true });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("proceeds to signIn when valid TOTP code provided", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
      twoFactorEnabled: true,
      totpSecret: "encrypted-secret",
    } as never);
    vi.mocked(verifyTotpCode).mockReturnValue(true);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await login({
      email: "user@example.com",
      password: "password123",
      code: "123456",
    });

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/",
    });
  });

  it("returns error when invalid TOTP code and no matching backup code", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
      twoFactorEnabled: true,
      totpSecret: "encrypted-secret",
    } as never);
    vi.mocked(verifyTotpCode).mockReturnValue(false);
    vi.mocked(db.twoFactorBackupCode.findMany).mockResolvedValue([]);

    const result = await login({
      email: "user@example.com",
      password: "password123",
      code: "000000",
    });

    expect(result).toEqual({ error: "Invalid code" });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("accepts a valid backup code and deletes it", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed",
      emailVerified: new Date(),
      twoFactorEnabled: true,
      totpSecret: "encrypted-secret",
    } as never);
    vi.mocked(verifyTotpCode).mockReturnValue(false);
    vi.mocked(db.twoFactorBackupCode.findMany).mockResolvedValue([
      { id: "bc-1", userId: "user-1", code: "hashed-backup" },
    ]);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(db.twoFactorBackupCode.delete).mockResolvedValue({} as never);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await login({
      email: "user@example.com",
      password: "password123",
      code: "abc12345",
    });

    expect(db.twoFactorBackupCode.delete).toHaveBeenCalledWith({
      where: { id: "bc-1" },
    });
    expect(signIn).toHaveBeenCalled();
  });
});
