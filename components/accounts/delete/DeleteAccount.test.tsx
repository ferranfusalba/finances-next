import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("sonner", () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast: t };
});

const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
  new Response(JSON.stringify({}), { status: 200 })
);

import DeleteAccount from "./DeleteAccount";

describe("DeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
  });

  it("renders the delete trigger button", () => {
    render(<DeleteAccount id="acc-1" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows confirmation dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount id="acc-1" />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Delete Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls DELETE endpoint and redirects on confirm", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount id="acc-1" />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/accounts/acc-1", {
        method: "DELETE",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/accounts/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows success toast on successful delete", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount id="acc-1" />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Account deleted successfully");
    });
  });

  it("shows error toast and does not redirect on failure", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: "Account not found" }), { status: 404 })
    );

    const user = userEvent.setup();
    render(<DeleteAccount id="acc-1" />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete account", {
        description: "Account not found",
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
