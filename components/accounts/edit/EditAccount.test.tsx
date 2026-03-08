import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { Account } from "@/types/Account";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

vi.mock("sonner", () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast: t };
});

const fetchSpy = vi
  .spyOn(globalThis, "fetch")
  .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

import EditAccount from "./EditAccount";

const account: Account = {
  id: "acc-1",
  order: 0,
  name: "Primary Space",
  code: "N26.PS",
  bankName: "N26",
  active: true,
  type: "Checking",
  description: "Main account",
  defaultCurrency: "EUR",
  currentBalance: 1000,
  number: "DE89 3704 0044",
  country: "DE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("EditAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
  });

  it("renders the edit trigger button", () => {
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    expect(
      screen.getByRole("button", { name: "Edit account" }),
    ).toBeInTheDocument();
  });

  it("shows edit dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit account" }));

    expect(screen.getByText("Edit Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("pre-fills form with account data", async () => {
    const user = userEvent.setup();
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit account" }));

    expect(screen.getByDisplayValue("N26")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Primary Space")).toBeInTheDocument();
    expect(screen.getByDisplayValue("N26.PS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DE89 3704 0044")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Main account")).toBeInTheDocument();
  });

  it("calls PUT endpoint on save", async () => {
    const user = userEvent.setup();
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit account" }));

    const nameInput = screen.getByDisplayValue("Primary Space");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Space");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/accounts/acc-1",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  it("shows success toast and refreshes on successful update", async () => {
    const user = userEvent.setup();
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit account" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Account updated successfully");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error toast on failure", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: "Duplicate code" }), {
        status: 409,
      }),
    );

    const user = userEvent.setup();
    render(
      <EditAccount account={account} accountTypes={["Checking", "Savings"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit account" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update account", {
        description: "Duplicate code",
      });
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
