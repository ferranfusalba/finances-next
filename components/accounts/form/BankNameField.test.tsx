import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";

import BankNameField from "./BankNameField";

function Wrapper({
  bankNames = ["BBVA", "N26"],
  defaultValue = "",
}: {
  bankNames?: string[];
  defaultValue?: string;
}) {
  const form = useForm({ defaultValues: { bankName: defaultValue } });

  return (
    <FormProvider {...form}>
      <form>
        <BankNameField bankNames={bankNames} />
        <output data-testid="value">{form.watch("bankName")}</output>
      </form>
    </FormProvider>
  );
}

describe("BankNameField", () => {
  it("offers the banks you already have accounts with", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toContain("BBVA");
    expect(options).toContain("N26");
  });

  it("picks an existing bank", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "BBVA" }));

    expect(screen.getByTestId("value")).toHaveTextContent("BBVA");
  });

  it("lets you add a bank that is not in the list", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Add a new bank/ }));
    await user.type(screen.getByLabelText("New Bank"), "Indexa Capital");

    expect(screen.getByTestId("value")).toHaveTextContent("Indexa Capital");
  });

  it("warns when the new bank is one you already have", async () => {
    // Not an error — the account still gets created, it just gets filed under
    // the bank that already exists rather than creating a near-duplicate.
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Add a new bank/ }));
    await user.type(screen.getByLabelText("New Bank"), "bbva");

    expect(
      screen.getByText(/already have an account with this bank/i),
    ).toBeInTheDocument();
  });

  it("skips the picker entirely on your very first account", () => {
    // Nothing to pick from, so asking you to click "Add a new bank" before you
    // can type would be pure ceremony.
    render(<Wrapper bankNames={[]} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("N26")).toBeInTheDocument();
  });

  it("shows a bank no other account uses as free text, not an empty selector", () => {
    // Editing an account whose bank is the only one of its kind: the value is
    // real and must stay visible.
    render(<Wrapper bankNames={["BBVA"]} defaultValue="Indexa Capital" />);

    expect(screen.getByDisplayValue("Indexa Capital")).toBeInTheDocument();
  });
});
