import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/reset", () => ({
  reset: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Poppins: () => ({ className: "mock-font" }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { reset } from "@/actions/reset";
import { ResetForm } from "./reset-form";

describe("ResetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email field", () => {
    render(<ResetForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders send reset email button", () => {
    render(<ResetForm />);

    expect(
      screen.getByRole("button", { name: "Send reset email" })
    ).toBeInTheDocument();
  });

  it("renders header and back button", () => {
    render(<ResetForm />);

    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
  });

  it("calls reset action with email on valid submit", async () => {
    const user = userEvent.setup();
    vi.mocked(reset).mockResolvedValue({ success: "Reset email sent" });

    render(<ResetForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send reset email" })
    );

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith({ email: "user@example.com" });
    });
  });

  it("displays error message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(reset).mockResolvedValue({ error: "Email not found" });

    render(<ResetForm />);

    await user.type(screen.getByLabelText("Email"), "ghost@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send reset email" })
    );

    await waitFor(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });
  });

  it("displays success message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(reset).mockResolvedValue({ success: "Reset email sent" });

    render(<ResetForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: "Send reset email" })
    );

    await waitFor(() => {
      expect(screen.getByText("Reset email sent")).toBeInTheDocument();
    });
  });
});
