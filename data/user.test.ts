import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { getUserByEmail, getUserById } from "./user";

describe("getUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when found", async () => {
    const mockUser = { id: "1", email: "user@example.com", name: "John" };
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserByEmail("user@example.com");

    expect(result).toEqual(mockUser);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.user.findUnique).mockRejectedValue(new Error("DB error"));

    const result = await getUserByEmail("user@example.com");

    expect(result).toBeNull();
  });
});

describe("getUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when found", async () => {
    const mockUser = { id: "1", email: "user@example.com", name: "John" };
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserById("1");

    expect(result).toEqual(mockUser);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });

  it("returns null on error", async () => {
    vi.mocked(db.user.findUnique).mockRejectedValue(new Error("DB error"));

    const result = await getUserById("1");

    expect(result).toBeNull();
  });
});
