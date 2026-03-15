import { describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";

import TransactionFormCategoryFields from "./TransactionFormCategoryFields";

const mockCategories = [
  {
    id: "cat1",
    userId: "u1",
    name: "Salary",
    type: "INCOME",
    color: "16A34A",
    defaultTaxRate: null,
    recurring: null,
    subcategories: [
      { id: "sub1", categoryId: "cat1", name: "Base", userId: "u1", defaultTaxRate: null, recurring: null },
    ],
  },
  {
    id: "cat2",
    userId: "u1",
    name: "Groceries",
    type: "EXPENSE",
    color: "DC2626",
    defaultTaxRate: null,
    recurring: null,
    subcategories: [
      { id: "sub2", categoryId: "cat2", name: "Supermarket", userId: "u1", defaultTaxRate: null, recurring: null },
    ],
  },
  {
    id: "cat3",
    userId: "u1",
    name: "Between Accounts",
    type: "TRANSFER",
    color: "0891B2",
    defaultTaxRate: null,
    recurring: null,
    subcategories: [],
  },
];

const defaultContextValue = {
  userId: "u1",
  userLocale: "en",
  userTimezone: "",
  userAccounts: [],
  userTransactionPayees: [],
  userTransactionCategories: mockCategories,
  userDefaultTaxRate: 0,
  userForeignCurrencies: [],
  userTransactionLocations: [],
  userTransactionTags: [],
  hasTransactions: false,
};

function Wrapper({ defaultType = "" }: { defaultType?: string }) {
  const form = useForm({
    defaultValues: {
      type: defaultType,
      category: "",
      subcategory: "",
    },
  });

  return (
    <TransactionUserProvider value={defaultContextValue}>
      <FormProvider {...form}>
        <form>
          <TransactionFormCategoryFields variant="account" />
        </form>
      </FormProvider>
    </TransactionUserProvider>
  );
}

function getCategoryCombobox() {
  const label = screen.getByText("Category");
  const container = label.closest(".space-y-2")!;
  return within(container as HTMLElement).getByRole("combobox");
}

function getSubcategoryCombobox() {
  const label = screen.getByText("Subcategory");
  const container = label.closest(".space-y-2")!;
  return within(container as HTMLElement).getByRole("combobox");
}

describe("TransactionFormCategoryFields", () => {
  it("disables category when no type is selected", () => {
    render(<Wrapper />);

    const categoryBtn = getCategoryCombobox();
    expect(categoryBtn).toBeDisabled();
    expect(categoryBtn).toHaveTextContent("Select a type first");
  });

  it("enables category when type is selected", () => {
    render(<Wrapper defaultType="EXPENSE" />);

    const categoryBtn = getCategoryCombobox();
    expect(categoryBtn).not.toBeDisabled();
    expect(categoryBtn).toHaveTextContent("Select a category");
  });

  it("shows only expense categories when type is EXPENSE", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper defaultType="EXPENSE" />);

    await user.click(getCategoryCombobox());

    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.queryByText("Between Accounts")).not.toBeInTheDocument();
  });

  it("shows only income categories when type is INCOME", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper defaultType="INCOME" />);

    await user.click(getCategoryCombobox());

    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
  });

  it("shows only transfer categories when type is TRANSFER", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper defaultType="TRANSFER" />);

    await user.click(getCategoryCombobox());

    expect(screen.getByText("Between Accounts")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
  });

  it("disables subcategory when no category is selected", () => {
    render(<Wrapper defaultType="EXPENSE" />);

    const subcategoryBtn = getSubcategoryCombobox();
    expect(subcategoryBtn).toBeDisabled();
    expect(subcategoryBtn).toHaveTextContent("Select a category first");
  });

  it("shows subcategories after selecting a category", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper defaultType="EXPENSE" />);

    await user.click(getCategoryCombobox());
    await user.click(screen.getByText("Groceries"));

    await waitFor(() => {
      expect(getSubcategoryCombobox()).not.toBeDisabled();
    });

    await user.click(getSubcategoryCombobox());
    expect(screen.getByText("Supermarket")).toBeInTheDocument();
  });
});
