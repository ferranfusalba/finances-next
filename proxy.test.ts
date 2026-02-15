import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

// Capture the callback passed to auth()
let authCallback: (req: unknown) => Response | null;

vi.mock("next-auth", () => ({
  default: () => ({
    auth: (cb: (req: unknown) => Response | null) => {
      authCallback = cb;
      return cb;
    },
  }),
}));

vi.mock("./auth.config.edge", () => ({ default: { providers: [] } }));

function makeReq(pathname: string, isLoggedIn: boolean) {
  return {
    auth: isLoggedIn ? { user: { id: "user-1" } } : null,
    nextUrl: new URL(`http://localhost${pathname}`),
  };
}

describe("proxy middleware", () => {
  beforeAll(async () => {
    await import("./proxy");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows API auth routes to pass through", () => {
    const result = authCallback(makeReq("/api/auth/callback", false));
    expect(result).toBeNull();
  });

  it("redirects logged-in users away from auth routes", () => {
    const result = authCallback(makeReq("/auth/login", true));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect(new URL((result as Response).headers.get("location")!).pathname).toBe("/");
  });

  it("allows unauthenticated users to access auth routes", () => {
    const result = authCallback(makeReq("/auth/login", false));
    expect(result).toBeNull();
  });

  it("allows unauthenticated users to access auth register", () => {
    const result = authCallback(makeReq("/auth/register", false));
    expect(result).toBeNull();
  });

  it("redirects unauthenticated users from private routes to login", () => {
    const result = authCallback(makeReq("/accounts", false));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect(
      new URL((result as Response).headers.get("location")!).pathname
    ).toBe("/auth/login");
  });

  it("allows authenticated users to access private routes", () => {
    const result = authCallback(makeReq("/accounts", true));
    expect(result).toBeNull();
  });

  it("redirects unauthenticated users from home to login", () => {
    const result = authCallback(makeReq("/", false));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect(
      new URL((result as Response).headers.get("location")!).pathname
    ).toBe("/auth/login");
  });

  it("allows unauthenticated users to access verification route", () => {
    const result = authCallback(makeReq("/auth/new-verification", false));
    expect(result).toBeNull();
  });
});
