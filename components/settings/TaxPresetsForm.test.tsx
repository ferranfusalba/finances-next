import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

vi.mock("sonner", () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast: t };
});

import TaxPresetsForm from "./TaxPresetsForm";

const mockCategories = [
  {
    id: "cat1",
    name: "Transport",
    type: "EXPENSE",
    defaultTaxRate: 10,
    subcategories: [
      {
        id: "sub1",
        name: "Metro",
        categoryId: "cat1",
        defaultTaxRate: 10,
      },
    ],
  },
  {
    id: "cat2",
    name: "Food",
    type: "EXPENSE",
    defaultTaxRate: 21,
    subcategories: [],
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("TaxPresetsForm", () => {
  it("renders preset groups by rate", () => {
    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("21%")).toBeInTheDocument();
  });

  it("renders category and subcategory chips", () => {
    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    expect(screen.getByText("Transport [E]")).toBeInTheDocument();
    expect(screen.getByText("Transport › Metro [E]")).toBeInTheDocument();
    expect(screen.getByText("Food [E]")).toBeInTheDocument();
  });

  it("sends categoryId when removing a category chip", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "cat2", defaultTaxRate: null }), {
        status: 200,
      }),
    );

    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    // Click the remove button on the "Food" category chip (in the 21% group)
    const removeButton = screen.getByLabelText("Remove Food [E]");
    await user.click(removeButton);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user/transaction-categories",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ categoryId: "cat2", defaultTaxRate: null }),
      }),
    );
  });

  it("sends subcategoryId when removing a subcategory chip", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "sub1", defaultTaxRate: null }), {
        status: 200,
      }),
    );

    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    // Click the remove button on the "Transport › Metro" subcategory chip
    const removeButton = screen.getByLabelText("Remove Transport › Metro [E]");
    await user.click(removeButton);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user/transaction-categories",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ subcategoryId: "sub1", defaultTaxRate: null }),
      }),
    );
  });

  it("shows success toast with rate when removing a chip", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "cat2", defaultTaxRate: null }), {
        status: 200,
      }),
    );

    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    await user.click(screen.getByLabelText("Remove Food [E]"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Removed Food [E] from 21% preset");
    });
  });

  it("shows error toast for duplicate preset rate", async () => {
    const user = userEvent.setup();
    render(
      <TaxPresetsForm categories={mockCategories} defaultTaxRate={21} />,
    );

    // Try adding a duplicate rate
    const rateInput = screen.getByPlaceholderText("10");
    await user.type(rateInput, "21");
    await user.click(screen.getByText("Add preset"));

    expect(toast.error).toHaveBeenCalledWith("A preset for 21% already exists");
  });
});
