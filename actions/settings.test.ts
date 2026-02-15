import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generateVerificationToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("./new-password", () => ({
  newPassword: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(() => "new-hashed-password"),
  },
}));

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getUserByEmail, getUserById } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { settings } from "./settings";

const validValues = {
  role: "USER" as const,
  userCountry: "US",
  userCurrency: "USD",
  userTimezone: "America/New_York",
  userLocale: "en-US",
};

describe("settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when no user session", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const result = await settings(validValues);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns error when user not found in DB", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
    } as never);
    vi.mocked(getUserById).mockResolvedValue(null);

    const result = await settings(validValues);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("strips email/password fields for OAuth users", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      isOAuth: true,
      email: "user@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const result = await settings({
      ...validValues,
      email: "new@example.com",
      password: "oldpass",
      newPassword: "newpass",
    });

    expect(result).toEqual({ success: "Settings Updated" });
    const updateData = vi.mocked(db.user.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(updateData.email).toBeUndefined();
    expect(updateData.password).toBeUndefined();
    expect(updateData.newPassword).toBeUndefined();
  });

  it("sends verification email when changing email", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      email: "old@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "old@example.com",
    } as never);
    vi.mocked(getUserByEmail).mockResolvedValue(null);
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "tok-1",
      email: "new@example.com",
      token: "verify-token",
      expires: new Date(),
    });

    const result = await settings({
      ...validValues,
      email: "new@example.com",
    });

    expect(result).toEqual({ success: "Verification email sent" });
    expect(generateVerificationToken).toHaveBeenCalledWith("new@example.com");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "new@example.com",
      "verify-token"
    );
  });

  it("returns error when new email is taken by another user", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      email: "old@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "old@example.com",
    } as never);
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-2",
      email: "taken@example.com",
    } as never);

    const result = await settings({
      ...validValues,
      email: "taken@example.com",
    });

    expect(result).toEqual({ error: "Email already in use" });
  });

  it("returns error when current password is incorrect", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "existing-hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await settings({
      ...validValues,
      password: "wrongpass",
      newPassword: "newpass123",
    });

    expect(result).toEqual({ error: "Incorrect password" });
  });

  it("hashes new password and updates user on valid password change", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "existing-hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const result = await settings({
      ...validValues,
      password: "oldpass123",
      newPassword: "newpass123",
    });

    expect(result).toEqual({
      success: "Password updated. Please log in again.",
      passwordChanged: true,
    });
    const updateData = vi.mocked(db.user.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(updateData.password).toBe("new-hashed-password");
    expect(updateData.newPassword).toBeUndefined();
  });

  it("updates settings without password change", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const result = await settings({
      ...validValues,
      name: "New Name",
    });

    expect(result).toEqual({ success: "Settings Updated" });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({ name: "New Name" }),
    });
  });
});
