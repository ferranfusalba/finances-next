import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";

import type { AccountTypeValue } from "@/lib/utils/account";
import type { Account } from "@/types/Account";

import TransactionFormBasicFields from "./TransactionFormBasicFields";

function makeAccount(
  id: string,
  name: string,
  type: AccountTypeValue,
  defaultCurrency = "EUR",
): Account {
  return {
    id,
    name,
    bankName: "Bank",
    defaultCurrency,
    order: 0,
    code: id,
    active: true,
    currentBalance: 0,
    number: null,
    country: "",
    type,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const accounts: Account[] = [
  makeAccount("a1", "Main", "CHECKING"),
  makeAccount("a2", "Savings", "SAVINGS", "USD"),
  makeAccount("a3", "Fondos", "INVESTMENT"),
];

const defaultContextValue = {
  userId: "u1",
  userLocale: "en",
  userTimezone: "",
  userAccounts: accounts,
  userTransactionPayees: [],
  userTransactionCategories: [],
  userDefaultTaxRate: 0,
  userForeignCurrencies: [],
  userTransactionTags: [],
  hasTransactions: false,
};

function Wrapper({
  accountType = "CHECKING",
  isTransferDestination = false,
  transferOriginAccountId,
  defaultType = "",
}: {
  accountType?: AccountTypeValue;
  isTransferDestination?: boolean;
  transferOriginAccountId?: string;
  defaultType?: string;
}) {
  const form = useForm({
    defaultValues: {
      concept: "",
      type: defaultType,
      typeTransferDestinationAccount: "",
      currency: "EUR",
      amountForm: "",
    },
  });

  return (
    <TransactionUserProvider value={defaultContextValue}>
      <FormProvider {...form}>
        <form>
          <TransactionFormBasicFields
            account={makeAccount("a1", "Main", accountType)}
            isTransferDestination={isTransferDestination}
            transferOriginAccountId={transferOriginAccountId}
          />
        </form>
      </FormProvider>
    </TransactionUserProvider>
  );
}

async function openTypeOptions(accountType?: AccountTypeValue) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<Wrapper accountType={accountType} />);
  await user.click(screen.getByText("Select a type"));
  return screen.getAllByRole("option").map((o) => o.textContent);
}

describe("TransactionFormBasicFields", () => {
  describe("type options follow the account type", () => {
    it.each(["CHECKING", "SAVINGS", "CASH", "PREPAID"] as const)(
      "offers only Income, Expense and Transfer on %s",
      async (accountType) => {
        const options = await openTypeOptions(accountType);

        expect(options).toEqual(["Income", "Expense", "Transfer"]);
      },
    );

    it("offers only market movement and transfers on INVESTMENT", async () => {
      // The sparse investment form is a consequence of the allowed-types table,
      // not a special case in the form: the field-heavy types are simply
      // unreachable here.
      const options = await openTypeOptions("INVESTMENT");

      expect(options).toEqual(["Return", "Rounding", "Transfer"]);
    });

    it("offers the cash-leg types on INVESTMENT_CASH", async () => {
      const options = await openTypeOptions("INVESTMENT_CASH");

      expect(options).toEqual([
        "Transfer",
        "Contribution",
        "Withdrawal",
        "Fee",
        "Withholding",
      ]);
    });

    it("keeps INVESTMENT_LEGACY exactly as it was", async () => {
      const options = await openTypeOptions("INVESTMENT_LEGACY");

      expect(options).toEqual([
        "Income",
        "Expense",
        "Transfer",
        "Return",
        "Withholding",
        "Rounding",
      ]);
    });
  });

  describe("Opening is never a choice", () => {
    it.each(["CHECKING", "SAVINGS", "CASH", "PREPAID", "INVESTMENT"] as const)(
      "never offers Opening on %s",
      async (accountType) => {
        // It is written at account creation, or via the missing-opening banner —
        // never picked from the dropdown.
        const options = await openTypeOptions(accountType);

        expect(options).not.toContain("Opening");
      },
    );

    it("shows Opening, locked, when the row already is one", async () => {
      // The banner opens this same form with the type pre-set; editing an
      // existing opening lands here too. Either way it is the only option and
      // the select is disabled — an opening cannot become an expense.
      render(<Wrapper defaultType="OPENING" />);

      const typeSelect = screen.getByRole("combobox", { name: "Type" });
      expect(typeSelect).toBeDisabled();
      expect(typeSelect).toHaveTextContent("Opening");
    });

    it("lets an opening go negative", () => {
      const { container } = render(<Wrapper defaultType="OPENING" />);

      // An account may legitimately open in the red — no min=0 floor.
      expect(container.querySelector("#amountForm")).not.toHaveAttribute(
        "min",
        "0",
      );
    });

    it("keeps the min=0 floor on an ordinary expense", () => {
      const { container } = render(<Wrapper defaultType="EXPENSE" />);

      expect(container.querySelector("#amountForm")).toHaveAttribute("min", "0");
    });
  });

  it("disables type select when editing transfer from destination side", () => {
    render(
      <Wrapper
        defaultType="TRANSFER"
        isTransferDestination
        transferOriginAccountId="a2"
      />,
    );

    const typeSelect = screen.getByRole("combobox");
    expect(typeSelect).toBeDisabled();
  });

  it("shows origin account name when editing transfer from destination side", () => {
    render(
      <Wrapper
        defaultType="TRANSFER"
        isTransferDestination
        transferOriginAccountId="a2"
      />,
    );

    expect(screen.getByText("Transfer from Origin Account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bank - Savings")).toBeInTheDocument();
  });
});
