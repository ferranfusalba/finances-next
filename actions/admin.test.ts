import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  currentRole: vi.fn(),
}));

import { currentRole } from "@/lib/auth";
import { admin } from "./admin";

describe("admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when user is ADMIN", async () => {
    vi.mocked(currentRole).mockResolvedValue("ADMIN");

    const result = await admin();

    expect(result).toEqual({ success: "Allowed Server Action" });
  });

  it("returns error when user is USER", async () => {
    vi.mocked(currentRole).mockResolvedValue("USER");

    const result = await admin();

    expect(result).toEqual({ error: "Forbidden Server Action" });
  });

  it("returns error when no role (unauthenticated)", async () => {
    vi.mocked(currentRole).mockResolvedValue(undefined);

    const result = await admin();

    expect(result).toEqual({ error: "Forbidden Server Action" });
  });
});
