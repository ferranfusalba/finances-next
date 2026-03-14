import { describe, expect, it } from "vitest";

import {
  LoginSchema,
  NewPasswordSchema,
  RegisterSchema,
  ResetSchema,
  SettingsSchema,
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  CreateAccountTransactionSchema,
  UpdateAccountTransactionSchema,
  CreateBudgetTransactionSchema,
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
    userCountry: "US",
    userCurrency: "USD",
    userTimezone: "America/New_York",
    userLocale: "en-US",
    weekStartsOn: 0,
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

  it("accepts weekStartsOn values 0 through 6", () => {
    for (const day of [0, 1, 2, 3, 4, 5, 6]) {
      const result = SettingsSchema.safeParse({ ...validBase, weekStartsOn: day });
      expect(result.success).toBe(true);
    }
  });

  it("rejects weekStartsOn below 0", () => {
    const result = SettingsSchema.safeParse({ ...validBase, weekStartsOn: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects weekStartsOn above 6", () => {
    const result = SettingsSchema.safeParse({ ...validBase, weekStartsOn: 7 });
    expect(result.success).toBe(false);
  });

  it("coerces weekStartsOn from string", () => {
    const result = SettingsSchema.safeParse({ ...validBase, weekStartsOn: "1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weekStartsOn).toBe(1);
    }
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
      userCountry: "US",
      userCurrency: "USD",
      userTimezone: "America/New_York",
      userLocale: "en-US",
      weekStartsOn: 0,
      password: "short",
      newPassword: "abcdef",
    });
    expect(result.success).toBe(false);
  });

  it("SettingsSchema rejects short newPassword in password change", () => {
    const result = SettingsSchema.safeParse({
      role: "USER" as const,
      userCountry: "US",
      userCurrency: "USD",
      userTimezone: "America/New_York",
      userLocale: "en-US",
      weekStartsOn: 0,
      password: "abcdef",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateAccountSchema", () => {
  const validAccount = {
    name: "Checking",
    code: "CHK",
    active: true,
    type: "CHECKING",
    defaultCurrency: "USD",
    country: "US",
    userId: "user-1",
  };

  it("accepts a valid account", () => {
    const result = CreateAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it("defaults currentBalance to 0 when omitted", () => {
    const result = CreateAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentBalance).toBe(0);
    }
  });

  it("defaults bankName to empty string when omitted", () => {
    const result = CreateAccountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bankName).toBe("");
    }
  });

  it("rejects missing name", () => {
    const { name: _, ...withoutName } = validAccount;
    const result = CreateAccountSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = CreateAccountSchema.safeParse({ ...validAccount, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing code", () => {
    const { code: _, ...withoutCode } = validAccount;
    const result = CreateAccountSchema.safeParse(withoutCode);
    expect(result.success).toBe(false);
  });

  it("rejects missing active", () => {
    const { active: _, ...withoutActive } = validAccount;
    const result = CreateAccountSchema.safeParse(withoutActive);
    expect(result.success).toBe(false);
  });

  it("rejects empty type", () => {
    const result = CreateAccountSchema.safeParse({ ...validAccount, type: "" });
    expect(result.success).toBe(false);
  });

  it("accepts nullable description", () => {
    const result = CreateAccountSchema.safeParse({
      ...validAccount,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable number", () => {
    const result = CreateAccountSchema.safeParse({
      ...validAccount,
      number: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateAccountSchema", () => {
  it("accepts partial update with just name", () => {
    const result = UpdateAccountSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = UpdateAccountSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = UpdateAccountSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty code when provided", () => {
    const result = UpdateAccountSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });

  it("accepts order field", () => {
    const result = UpdateAccountSchema.safeParse({ order: 5 });
    expect(result.success).toBe(true);
  });

  it("accepts currentBalance update", () => {
    const result = UpdateAccountSchema.safeParse({ currentBalance: 1500.50 });
    expect(result.success).toBe(true);
  });
});

describe("CreateBudgetSchema", () => {
  const validBudget = {
    name: "Marketing",
    code: "MKT",
    active: true,
    type: "MONTHLY",
    initialBalance: 1000,
    userId: "user-1",
  };

  it("accepts a valid budget", () => {
    const result = CreateBudgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
  });

  it("defaults defaultCurrency to empty string when omitted", () => {
    const result = CreateBudgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCurrency).toBe("");
    }
  });

  it("rejects missing name", () => {
    const { name: _, ...withoutName } = validBudget;
    const result = CreateBudgetSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects missing code", () => {
    const { code: _, ...withoutCode } = validBudget;
    const result = CreateBudgetSchema.safeParse(withoutCode);
    expect(result.success).toBe(false);
  });

  it("rejects missing initialBalance", () => {
    const { initialBalance: _, ...withoutBalance } = validBudget;
    const result = CreateBudgetSchema.safeParse(withoutBalance);
    expect(result.success).toBe(false);
  });

  it("rejects empty type", () => {
    const result = CreateBudgetSchema.safeParse({ ...validBudget, type: "" });
    expect(result.success).toBe(false);
  });

  it("accepts nullable description", () => {
    const result = CreateBudgetSchema.safeParse({
      ...validBudget,
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateBudgetSchema", () => {
  it("accepts partial update with just name", () => {
    const result = UpdateBudgetSchema.safeParse({ name: "New Budget" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = UpdateBudgetSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = UpdateBudgetSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty code when provided", () => {
    const result = UpdateBudgetSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });

  it("accepts order field", () => {
    const result = UpdateBudgetSchema.safeParse({ order: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts initialBalance and currentBalance updates", () => {
    const result = UpdateBudgetSchema.safeParse({
      initialBalance: 2000,
      currentBalance: 1500,
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateAccountTransactionSchema", () => {
  const validTransaction = {
    payee: "Store",
    concept: "Groceries",
    type: "EXPENSE",
    currency: "USD",
    amount: -50,
    accountId: "acc-1",
    dateTime: "2024-01-15T10:00:00Z",
    notes: "",
  };

  it("accepts a valid transaction", () => {
    const result = CreateAccountTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it("accepts empty concept (optional)", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      concept: "",
    });
    expect(result.success).toBe(true);
  });

  it("defaults concept to empty string when omitted", () => {
    const { concept: _, ...withoutConcept } = validTransaction;
    const result = CreateAccountTransactionSchema.safeParse(withoutConcept);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.concept).toBe("");
    }
  });

  it("rejects missing required fields", () => {
    const result = CreateAccountTransactionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty type", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      type: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts transaction with taxLines", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      taxLines: [
        { rate: 21, amount: 50, inclusive: true, taxAmount: 8.68 },
        { rate: 10, amount: 30, inclusive: false, taxAmount: 3 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts transaction with null taxLines", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      taxLines: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts transaction without taxLines (optional)", () => {
    const result = CreateAccountTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxLines).toBeUndefined();
    }
  });

  it("rejects taxLines with missing fields", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      taxLines: [{ rate: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags as string array", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      tags: ["amazon", "home-renovation"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual(["amazon", "home-renovation"]);
  });

  it("accepts empty tags array", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      tags: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing tags (optional)", () => {
    const result = CreateAccountTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toBeUndefined();
  });

  it("rejects tags as plain string", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      tags: "amazon",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid location object", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      location: {
        name: "Zürich Flughafen",
        address: "Kloten, Switzerland",
        lat: 47.458,
        lng: 8.555,
        placeId: "mapbox-123",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null location", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing location (optional)", () => {
    const result = CreateAccountTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.location).toBeUndefined();
  });

  it("rejects location as plain string", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      location: "Barcelona",
    });
    expect(result.success).toBe(false);
  });

  it("rejects location with missing fields", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      location: { name: "Barcelona" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts recurring as null when omitted", () => {
    const result = CreateAccountTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBeUndefined();
    }
  });

  it("accepts recurring as MONTHLY", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      recurring: "MONTHLY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBe("MONTHLY");
    }
  });

  it("accepts recurring as YEARLY", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      recurring: "YEARLY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBe("YEARLY");
    }
  });

  it("accepts recurring as null", () => {
    const result = CreateAccountTransactionSchema.safeParse({
      ...validTransaction,
      recurring: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBeNull();
    }
  });
});

describe("CreateBudgetTransactionSchema", () => {
  const validTransaction = {
    concept: "Office supplies",
    type: "EXPENSE",
    currency: "USD",
    amount: -30,
    budgetId: "bgt-1",
    dateTime: "2024-01-15T10:00:00Z",
    notes: "",
  };

  it("accepts a valid transaction", () => {
    const result = CreateBudgetTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it("accepts empty concept (optional)", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      concept: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing budgetId", () => {
    const { budgetId: _, ...withoutBudgetId } = validTransaction;
    const result = CreateBudgetTransactionSchema.safeParse(withoutBudgetId);
    expect(result.success).toBe(false);
  });

  it("accepts tags as string array", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      tags: ["project-x"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual(["project-x"]);
  });

  it("rejects tags as plain string", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      tags: "project-x",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid location object", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      location: {
        name: "Madrid Office",
        address: "Madrid, Spain",
        lat: 40.416,
        lng: -3.703,
        placeId: "mapbox-456",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null location", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects location as plain string", () => {
    const result = CreateBudgetTransactionSchema.safeParse({
      ...validTransaction,
      location: "Madrid",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateAccountTransactionSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = UpdateAccountTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts recurring as MONTHLY", () => {
    const result = UpdateAccountTransactionSchema.safeParse({
      recurring: "MONTHLY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBe("MONTHLY");
    }
  });

  it("accepts recurring as YEARLY", () => {
    const result = UpdateAccountTransactionSchema.safeParse({
      recurring: "YEARLY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBe("YEARLY");
    }
  });

  it("accepts recurring as null to clear it", () => {
    const result = UpdateAccountTransactionSchema.safeParse({
      recurring: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurring).toBeNull();
    }
  });

  it("accepts partial update with just amount", () => {
    const result = UpdateAccountTransactionSchema.safeParse({ amount: -100 });
    expect(result.success).toBe(true);
  });
});
