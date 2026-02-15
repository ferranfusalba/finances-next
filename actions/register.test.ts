import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { create: vi.fn() },
  },
}));

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generateVerificationToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(() => "hashed-password") },
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => ({ check: () => ({ success: true }) }),
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { register } from "./register";

describe("register", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.REGISTRATION_DISABLED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns error when registration is disabled", async () => {
    process.env.REGISTRATION_DISABLED = "true";

    const result = await register({
      email: "new@example.com",
      password: "password123",
      name: "John",
    });

    expect(result).toEqual({ error: "Registration is currently disabled" });
  });

  it("returns error for invalid fields", async () => {
    const result = await register({
      email: "bad",
      password: "12345",
      name: "",
    });

    expect(result).toEqual({ error: "Invalid fields!" });
  });

  it("returns error when email is already in use", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "existing-user",
      email: "user@example.com",
    } as never);

    const result = await register({
      email: "user@example.com",
      password: "password123",
      name: "John",
    });

    expect(result).toEqual({ error: "Email already in use!" });
  });

  it("creates user, hashes password, and sends verification email", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({} as never);
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "tok-1",
      email: "new@example.com",
      token: "verify-token",
      expires: new Date(),
    });

    const result = await register({
      email: "new@example.com",
      password: "password123",
      name: "John",
    });

    expect(result).toEqual({ success: "Confirmation email sent!" });
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "John",
        email: "new@example.com",
        password: "hashed-password",
      },
    });
    expect(generateVerificationToken).toHaveBeenCalledWith("new@example.com");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "new@example.com",
      "verify-token"
    );
  });
});
