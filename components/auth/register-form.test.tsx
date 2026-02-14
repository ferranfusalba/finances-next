import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/register", () => ({
  register: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Poppins: () => ({ className: "mock-font" }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { register } from "@/actions/register";
import { RegisterForm } from "./register-form";

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders name, email, and password fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders create account button", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("button", { name: "Create an account" })
    ).toBeInTheDocument();
  });

  it("renders back button to login", () => {
    render(<RegisterForm />);

    expect(
      screen.getByText("Already have an account?")
    ).toBeInTheDocument();
  });

  it("calls register action with form data on valid submit", async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue({
      success: "Confirmation email sent!",
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(
      screen.getByRole("button", { name: "Create an account" })
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
    });
  });

  it("displays error message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue({
      error: "Email already in use!",
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(
      screen.getByRole("button", { name: "Create an account" })
    );

    await waitFor(() => {
      expect(screen.getByText("Email already in use!")).toBeInTheDocument();
    });
  });

  it("displays success message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue({
      success: "Confirmation email sent!",
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(
      screen.getByRole("button", { name: "Create an account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Confirmation email sent!")
      ).toBeInTheDocument();
    });
  });
});
