import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";

import TransactionFormBasicFields from "./TransactionFormBasicFields";

const defaultContextValue = {
  userId: "u1",
  userLocale: "en",
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
      currentBalance: 0,
      number: null,
      country: "",
      type: "",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "a2",
      name: "Savings",
      bankName: "Bank",
      defaultCurrency: "USD",
      order: 1,
      code: "a2",
      active: true,
      currentBalance: 0,
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
  hasTransactions: false,
};

function Wrapper({
  hasOpeningTransaction = false,
  variant = "account",
  isTransferDestination = false,
  transferOriginAccountId,
  defaultType = "",
}: {
  hasOpeningTransaction?: boolean;
  variant?: "account" | "budget";
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
            variant={variant}
            account={defaultContextValue.userAccounts[0]}
            hasOpeningTransaction={hasOpeningTransaction}
            isTransferDestination={isTransferDestination}
            transferOriginAccountId={transferOriginAccountId}
          />
        </form>
      </FormProvider>
    </TransactionUserProvider>
  );
}

describe("TransactionFormBasicFields", () => {
  it("shows OPENING option when account has no opening transaction", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper hasOpeningTransaction={false} />);

    await user.click(screen.getByText("Select a type"));

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("OPENING");
  });

  it("hides OPENING option when account already has opening transaction", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper hasOpeningTransaction={true} />);

    await user.click(screen.getByText("Select a type"));

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).not.toContain("OPENING");
  });

  it("shows account-specific type options in account variant", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper variant="account" />);

    await user.click(screen.getByText("Select a type"));

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("INCOME");
    expect(optionTexts).toContain("EXPENSE");
    expect(optionTexts).toContain("TRANSFER");
    expect(optionTexts).toContain("OPENING");
  });

  it("hides account-only types in budget variant", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper variant="budget" />);

    await user.click(screen.getByText("Select a type"));

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("INCOME");
    expect(optionTexts).toContain("EXPENSE");
    expect(optionTexts).not.toContain("OPENING");
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
