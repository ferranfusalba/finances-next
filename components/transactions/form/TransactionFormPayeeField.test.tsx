import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";

import TransactionFormPayeeField from "./TransactionFormPayeeField";

const defaultContextValue = {
  userId: "u1",
  userLocale: "en",
  userTimezone: "",
  userAccounts: [],
  userTransactionPayees: [
    { id: "p1", userId: "u1", name: "Amazon" },
    { id: "p2", userId: "u1", name: "Spotify" },
  ],
  userTransactionCategories: [],
  userDefaultTaxRate: 0,
  userForeignCurrencies: [],
  userTransactionTags: [],
  hasTransactions: false,
};

function Wrapper({
  payees = defaultContextValue.userTransactionPayees,
}: {
  payees?: typeof defaultContextValue.userTransactionPayees;
}) {
  const form = useForm({
    defaultValues: {
      payee: "",
    },
  });

  return (
    <TransactionUserProvider value={{ ...defaultContextValue, userTransactionPayees: payees }}>
      <FormProvider {...form}>
        <form>
          <TransactionFormPayeeField />
        </form>
      </FormProvider>
    </TransactionUserProvider>
  );
}

async function selectAddNewPayee(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Select a payee"));
  await user.click(screen.getByText("Add a new payee"));
}

describe("TransactionFormPayeeField", () => {
  it("shows existing payees in the dropdown", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await user.click(screen.getByText("Select a payee"));

    expect(screen.getByText("Amazon")).toBeInTheDocument();
    expect(screen.getByText("Spotify")).toBeInTheDocument();
  });

  it("shows new payee input when 'Add a new payee' is selected", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await selectAddNewPayee(user);

    expect(screen.getByLabelText("New Payee")).toBeInTheDocument();
  });

  it("shows informative message when typing an existing payee name", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await selectAddNewPayee(user);
    await user.type(screen.getByLabelText("New Payee"), "Amazon");

    expect(
      screen.getByText("A payee with this name already exists. The existing one will be used."),
    ).toBeInTheDocument();
  });

  it("shows informative message with case-insensitive match", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await selectAddNewPayee(user);
    await user.type(screen.getByLabelText("New Payee"), "amazon");

    expect(
      screen.getByText("A payee with this name already exists. The existing one will be used."),
    ).toBeInTheDocument();
  });

  it("does not show message when typing a new unique payee name", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await selectAddNewPayee(user);
    await user.type(screen.getByLabelText("New Payee"), "Netflix");

    expect(
      screen.queryByText("A payee with this name already exists. The existing one will be used."),
    ).not.toBeInTheDocument();
  });

  it("does not show message when new payee input is empty", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Wrapper />);

    await selectAddNewPayee(user);

    expect(
      screen.queryByText("A payee with this name already exists. The existing one will be used."),
    ).not.toBeInTheDocument();
  });
});
