import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGet = vi.fn();

vi.mock("@/actions/new-password", () => ({
  newPassword: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Poppins: () => ({ className: "mock-font" }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { newPassword } from "@/actions/new-password";
import { NewPasswordForm } from "./new-password-form";

describe("NewPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue("test-reset-token");
  });

  it("renders password field", () => {
    render(<NewPasswordForm />);

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders reset password button", () => {
    render(<NewPasswordForm />);

    expect(
      screen.getByRole("button", { name: "Reset password" })
    ).toBeInTheDocument();
  });

  it("renders header and back button", () => {
    render(<NewPasswordForm />);

    expect(screen.getByText("Enter a new password")).toBeInTheDocument();
    expect(screen.getByText("Back to login")).toBeInTheDocument();
  });

  it("calls newPassword action with password and token", async () => {
    const user = userEvent.setup();
    vi.mocked(newPassword).mockResolvedValue({
      success: "Password updated",
    });

    render(<NewPasswordForm />);

    await user.type(screen.getByLabelText("Password"), "newpass123");
    await user.click(
      screen.getByRole("button", { name: "Reset password" })
    );

    await waitFor(() => {
      expect(newPassword).toHaveBeenCalledWith(
        { password: "newpass123" },
        "test-reset-token"
      );
    });
  });

  it("displays error message from action", async () => {
    const user = userEvent.setup();
    vi.mocked(newPassword).mockResolvedValue({ error: "Token has expired" });

    render(<NewPasswordForm />);

    await user.type(screen.getByLabelText("Password"), "newpass123");
    await user.click(
      screen.getByRole("button", { name: "Reset password" })
    );

    await waitFor(() => {
      expect(screen.getByText("Token has expired")).toBeInTheDocument();
    });
  });

  it("passes null token when not in URL", async () => {
    const user = userEvent.setup();
    mockGet.mockReturnValue(null);
    vi.mocked(newPassword).mockResolvedValue({ error: "Missing token" });

    render(<NewPasswordForm />);

    await user.type(screen.getByLabelText("Password"), "newpass123");
    await user.click(
      screen.getByRole("button", { name: "Reset password" })
    );

    await waitFor(() => {
      expect(newPassword).toHaveBeenCalledWith(
        { password: "newpass123" },
        null
      );
    });
  });
});
