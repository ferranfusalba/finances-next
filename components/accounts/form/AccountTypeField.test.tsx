import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import AccountTypeField from "./AccountTypeField";
import { AccountTypeSchema } from "@/schemas";

const schema = z.object({ type: AccountTypeSchema });

function Wrapper({ defaultType = "" }: { defaultType?: string }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType as never },
  });

  return (
    <FormProvider {...form}>
      <form>
        <AccountTypeField />
      </form>
    </FormProvider>
  );
}

describe("AccountTypeField", () => {
  it("renders the combobox trigger with label", () => {
    render(<Wrapper />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Account Type*")).toBeInTheDocument();
  });

  it("shows placeholder when no default type", () => {
    render(<Wrapper />);

    expect(screen.getByText("Select an account type")).toBeInTheDocument();
  });

  it("shows the default type value when provided", () => {
    render(<Wrapper defaultType="CHECKING" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Checking");
  });

  it("offers exactly the five enum members, and no free-text escape hatch", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    expect(items.map((i) => i.textContent)).toEqual([
      "Checking",
      "Savings",
      "Cash",
      "Prepaid",
      "Investment",
    ]);

    // The old field let the user invent a type by typing one in. Account type
    // now drives behaviour, so it can no longer be arbitrary.
    expect(screen.queryByText("Add a new type")).not.toBeInTheDocument();
  });

  it("explains what the selected type does", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Investment" }));

    expect(
      screen.getByText(/records returns and retenciones/i),
    ).toBeInTheDocument();
  });

  it("has search input in dropdown", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("combobox"));

    expect(
      screen.getByPlaceholderText("Search account types..."),
    ).toBeInTheDocument();
  });
});
