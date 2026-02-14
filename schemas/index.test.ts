import { describe, expect, it } from "vitest";

import {
  LoginSchema,
  NewPasswordSchema,
  RegisterSchema,
  ResetSchema,
  SettingsSchema,
} from "./index";

describe("LoginSchema", () => {
  it("accepts valid credentials", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("accepts valid registration", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "12345",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Minimum 6 characters required"
      );
    }
  });

  it("rejects missing name", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = RegisterSchema.safeParse({
      email: "bad-email",
      password: "password123",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("ResetSchema", () => {
  it("accepts valid email", () => {
    const result = ResetSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = ResetSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("NewPasswordSchema", () => {
  it("accepts password with 6+ characters", () => {
    const result = NewPasswordSchema.safeParse({ password: "newpass" });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = NewPasswordSchema.safeParse({ password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Minimum 6 characters required"
      );
    }
  });
});

describe("SettingsSchema", () => {
  const validBase = {
    role: "USER" as const,
    defaultCountry: "US",
    defaultCurrency: "USD",
  };

  it("accepts valid settings without password change", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      name: "John Doe",
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid settings with password change", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      password: "oldpass",
      newPassword: "newpass",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password without newPassword", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      password: "oldpass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("newPassword");
    }
  });

  it("rejects newPassword without password", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      newPassword: "newpass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("password");
    }
  });

  it("rejects invalid role", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      role: "SUPERADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = SettingsSchema.safeParse({
      ...validBase,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("boundary cases", () => {
  it("RegisterSchema accepts password exactly 6 characters", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "abcdef",
      name: "John",
    });
    expect(result.success).toBe(true);
  });

  it("RegisterSchema rejects password of 5 characters", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "abcde",
      name: "John",
    });
    expect(result.success).toBe(false);
  });

  it("NewPasswordSchema accepts password exactly 6 characters", () => {
    const result = NewPasswordSchema.safeParse({ password: "abcdef" });
    expect(result.success).toBe(true);
  });

  it("NewPasswordSchema rejects password of 5 characters", () => {
    const result = NewPasswordSchema.safeParse({ password: "abcde" });
    expect(result.success).toBe(false);
  });

  it("LoginSchema accepts password of 1 character (min 1)", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("SettingsSchema rejects short password in password change", () => {
    const result = SettingsSchema.safeParse({
      role: "USER" as const,
      defaultCountry: "US",
      defaultCurrency: "USD",
      password: "short",
      newPassword: "abcdef",
    });
    expect(result.success).toBe(false);
  });

  it("SettingsSchema rejects short newPassword in password change", () => {
    const result = SettingsSchema.safeParse({
      role: "USER" as const,
      defaultCountry: "US",
      defaultCurrency: "USD",
      password: "abcdef",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});
