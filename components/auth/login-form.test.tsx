import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/login", () => ({
  login: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Poppins: () => ({ className: "mock-font" }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { login } from "@/actions/login";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    render(<LoginForm />);

    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("renders back button to register", () => {
    render(<LoginForm />);

    expect(
      screen.getByText("Don't have an account?")
    ).toBeInTheDocument();
  });

  it("calls login action with form data on valid submit", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({ success: "Logged in" });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
        code: "",
      });
    });
  });

  it("displays error message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({ error: "Invalid credentials!" });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials!")).toBeInTheDocument();
    });
  });

  it("displays success message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({
      success: "Confirmation email sent",
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(
        screen.getByText("Confirmation email sent")
      ).toBeInTheDocument();
    });
  });

  it("renders header label", () => {
    render(<LoginForm />);

    const headerLabel = screen.getAllByText("Sign In");
    expect(headerLabel.length).toBeGreaterThanOrEqual(1);
    expect(headerLabel.some((el) => el.tagName === "P")).toBe(true);
  });
});
