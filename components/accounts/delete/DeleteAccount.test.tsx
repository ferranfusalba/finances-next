import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
  new Response(JSON.stringify({}))
);

import DeleteAccount from "./DeleteAccount";

describe("DeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
