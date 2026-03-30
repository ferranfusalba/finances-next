import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";
import { CollapseMonthsProvider } from "@/contexts/CollapseMonthsContext";
import { AccountTransaction } from "@/types/Transaction";

import AccountTransactionTable from "./AccountTransactionTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const defaultContextValue = {
  userId: "u1",
  userLocale: "en-US",
  userTimezone: "",
  userAccounts: [
    {
      id: "a1",
      name: "Main",
      bankName: "Bank",
      defaultCurrency: "EUR",
      order: 0,
      code: "a1",
      active: true,
      currentBalance: 1000,
      number: null,
      country: "",
      type: "",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  userTransactionPayees: [],
  userTransactionCategories: [],
  userDefaultTaxRate: 0,
  userForeignCurrencies: [],
  userTransactionLocations: [],
  userTransactionTags: [],
  hasTransactions: true,
};

const account = defaultContextValue.userAccounts[0];

function makeTx(overrides: Partial<AccountTransaction> & { id: string }): AccountTransaction {
  return {
    accountId: "a1",
    amount: -10,
    category: "Food",
    concept: "Groceries",
    createdAt: new Date("2025-06-15T10:00:00Z"),
    currency: "EUR",
    dateTime: new Date("2025-06-15T10:00:00Z"),
    notes: "",
    payee: "Supermarket",
    recurring: null,
    subcategory: null,
    type: "EXPENSE",
    updatedAt: new Date("2025-06-15T10:00:00Z"),
    ...overrides,
  };
}

const sampleTransactions: AccountTransaction[] = [
  makeTx({
    id: "t1",
    payee: "Amazon",
    concept: "Electronics",
    category: "Shopping",
    amount: -120,
    dateTime: new Date("2025-06-01T10:00:00Z"),
  }),
  makeTx({
    id: "t2",
    payee: "Supermarket",
    concept: "Weekly groceries",
    category: "Food",
    amount: -45,
    dateTime: new Date("2025-06-10T10:00:00Z"),
  }),
  makeTx({
    id: "t3",
    payee: "Salary Corp",
    concept: "Monthly salary",
    category: "Income",
    type: "INCOME",
    amount: 3000,
    dateTime: new Date("2025-06-15T10:00:00Z"),
  }),
  makeTx({
    id: "t4",
    payee: "Coffee Shop",
    concept: "Latte",
    category: "Food",
    amount: -5,
    dateTime: new Date("2025-07-02T10:00:00Z"),
    notes: "Good coffee",
  }),
];

function renderTable(transactions = sampleTransactions) {
  return render(
    <TransactionUserProvider value={defaultContextValue}>
      <CollapseMonthsProvider>
        <AccountTransactionTable
          accountTransactions={transactions}
          account={account}
          carryForwardBalance={0}
        />
      </CollapseMonthsProvider>
    </TransactionUserProvider>,
  );
}

describe("AccountTransactionTable", () => {
  describe("Search", () => {
    it("renders the search input", () => {
      renderTable();
      expect(
        screen.getByPlaceholderText("Search transactions..."),
      ).toBeInTheDocument();
    });

    it("filters transactions by payee", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByPlaceholderText("Search transactions...");
      await user.type(searchInput, "Amazon");

      expect(screen.getByText("1 transactions")).toBeInTheDocument();
      expect(screen.getByText("Amazon")).toBeInTheDocument();
      expect(screen.queryByText("Supermarket")).not.toBeInTheDocument();
    });

    it("filters transactions by category", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByPlaceholderText("Search transactions...");
      await user.type(searchInput, "Food");

      expect(screen.getByText("2 transactions")).toBeInTheDocument();
    });

    it("filters transactions by concept", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByPlaceholderText("Search transactions...");
      await user.type(searchInput, "salary");

      expect(screen.getByText("1 transactions")).toBeInTheDocument();
      expect(screen.getByText("Salary Corp")).toBeInTheDocument();
    });

    it("shows all transactions when search is cleared", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByPlaceholderText("Search transactions...");
      await user.type(searchInput, "Amazon");
      expect(screen.getByText("1 transactions")).toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText("4 transactions")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("shows transaction count", () => {
      renderTable();
      expect(screen.getByText("4 transactions")).toBeInTheDocument();
    });

    it("shows page size selector with default value of 50", () => {
      renderTable();
      const select = screen.getByRole("combobox", { hidden: true }) as HTMLSelectElement;
      if (select) {
        expect(select.value).toBe("50");
      } else {
        const selectEl = screen.getByDisplayValue("50");
        expect(selectEl).toBeInTheDocument();
      }
    });

    it("does not show pagination arrows when all data fits on one page", () => {
      renderTable();
      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });

    it("shows pagination when transactions exceed page size", async () => {
      const user = userEvent.setup();
      const manyTx = Array.from({ length: 30 }, (_, i) =>
        makeTx({
          id: `t-${i}`,
          payee: `Payee ${i}`,
          dateTime: new Date(`2025-06-${String(i + 1).padStart(2, "0")}T10:00:00Z`),
        }),
      );

      renderTable(manyTx);

      // Change page size to 25
      const select = screen.getByDisplayValue("50");
      await user.selectOptions(select, "25");

      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("navigates to the next page when clicking the next button", async () => {
      const user = userEvent.setup();
      const manyTx = Array.from({ length: 30 }, (_, i) =>
        makeTx({
          id: `t-${i}`,
          payee: `Payee ${i}`,
          dateTime: new Date(`2025-06-${String(i + 1).padStart(2, "0")}T10:00:00Z`),
        }),
      );

      renderTable(manyTx);

      // Change page size to 25 so we get 2 pages
      const select = screen.getByDisplayValue("50");
      await user.selectOptions(select, "25");
      expect(screen.getByText("1 / 2")).toBeInTheDocument();

      // Click the next-page button (sibling after the page indicator)
      const paginationText = screen.getByText("1 / 2");
      const nextBtn = paginationText.nextElementSibling as HTMLElement;
      await user.click(nextBtn);

      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });
  });

  describe("Column Visibility", () => {
    it("renders the Columns button", () => {
      renderTable();
      expect(screen.getByText("Columns")).toBeInTheDocument();
    });

    it("opens column visibility dropdown on click", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByText("Columns"));

      // Dropdown menu items should appear (they are menuitems with checkbox labels)
      const menuItems = screen.getAllByRole("menuitem");
      const menuLabels = menuItems.map((item) => item.textContent);
      expect(menuLabels).toContain("Date & Time");
      expect(menuLabels).toContain("Payee");
      expect(menuLabels).toContain("Category");
    });

    it("hides a column when unchecked", async () => {
      const user = userEvent.setup();
      renderTable();

      // Verify "Recurring" header is visible in the table
      const table = screen.getByRole("table");
      expect(within(table).getByText("Recurring")).toBeInTheDocument();

      // Open columns dropdown and uncheck Recurring
      await user.click(screen.getByText("Columns"));

      const recurringItem = screen.getByRole("menuitem", {
        name: /Recurring/,
      });
      await user.click(recurringItem);

      // "Recurring" header should no longer be in the table
      expect(within(table).queryByText("Recurring")).not.toBeInTheDocument();
    });

    it("shows a column when re-checked", async () => {
      const user = userEvent.setup();
      renderTable();

      const table = screen.getByRole("table");

      // Hide Recurring
      await user.click(screen.getByText("Columns"));
      const recurringItem = screen.getByRole("menuitem", {
        name: /Recurring/,
      });
      await user.click(recurringItem);
      expect(within(table).queryByText("Recurring")).not.toBeInTheDocument();

      // Re-show Recurring
      await user.click(recurringItem);
      expect(within(table).getByText("Recurring")).toBeInTheDocument();
    });
  });

  describe("Column Filters", () => {
    it("renders the Filters button", () => {
      renderTable();
      expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("shows filter row when Filters is clicked", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByText("Filters"));

      // Filter inputs should appear (placeholder text matches column labels)
      expect(screen.getByPlaceholderText("Payee")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Category")).toBeInTheDocument();
    });

    it("filters by a specific column", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByText("Filters"));

      const payeeFilter = screen.getByPlaceholderText("Payee");
      await user.type(payeeFilter, "Amazon");

      expect(screen.getByText("1 transactions")).toBeInTheDocument();
      expect(screen.getByText("Amazon")).toBeInTheDocument();
    });

    it("supports multiple column filters simultaneously", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByText("Filters"));

      const categoryFilter = screen.getByPlaceholderText("Category");
      await user.type(categoryFilter, "Food");

      // Should match t2 (Supermarket/Food) and t4 (Coffee Shop/Food)
      expect(screen.getByText("2 transactions")).toBeInTheDocument();

      const payeeFilter = screen.getByPlaceholderText("Payee");
      await user.type(payeeFilter, "Coffee");

      // Should match only t4
      expect(screen.getByText("1 transactions")).toBeInTheDocument();
      expect(screen.getByText("Coffee Shop")).toBeInTheDocument();
    });

    it("clears all column filters when Filters is toggled off", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByText("Filters"));

      const payeeFilter = screen.getByPlaceholderText("Payee");
      await user.type(payeeFilter, "Amazon");
      expect(screen.getByText("1 transactions")).toBeInTheDocument();

      // Toggle filters off
      await user.click(screen.getByText("Filters"));

      // All transactions should be visible again
      expect(screen.getByText("4 transactions")).toBeInTheDocument();
    });
  });
});
