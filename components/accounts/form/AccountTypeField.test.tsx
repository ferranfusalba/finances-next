import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import AccountTypeField from "./AccountTypeField";

const schema = z.object({ type: z.string().min(1) });

function Wrapper({
  accountTypes,
  defaultType = "",
}: {
  accountTypes: string[];
  defaultType?: string;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType },
  });

  return (
    <FormProvider {...form}>
      <form>
        <AccountTypeField accountTypes={accountTypes} />
      </form>
    </FormProvider>
  );
}

describe("AccountTypeField", () => {
  it("renders the combobox trigger with label", () => {
    render(<Wrapper accountTypes={["Checking", "Savings"]} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Account Type*")).toBeInTheDocument();
  });

  it("shows placeholder when no default type", () => {
    render(<Wrapper accountTypes={["Checking"]} />);

    expect(screen.getByText("Select an account type")).toBeInTheDocument();
  });

  it("shows the default type value when provided", () => {
    render(<Wrapper accountTypes={["Checking"]} defaultType="Checking" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Checking");
  });

  it("opens dropdown and shows options when clicked", async () => {
    const user = userEvent.setup();
    render(<Wrapper accountTypes={["Checking", "Savings"]} />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("Add a new type")).toBeInTheDocument();
    expect(screen.getByText("Checking")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });

  it("shows options sorted alphabetically with 'Add a new type' first", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper accountTypes={["Savings", "Checking", "Investment"]} />,
    );

    await user.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveTextContent("Add a new type");
    expect(items[1]).toHaveTextContent("Checking");
    expect(items[2]).toHaveTextContent("Investment");
    expect(items[3]).toHaveTextContent("Savings");
  });

  it("shows only 'Add a new type' when no account types exist", async () => {
    const user = userEvent.setup();
    render(<Wrapper accountTypes={[]} />);

    await user.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Add a new type");
  });

  it("has search input in dropdown", async () => {
    const user = userEvent.setup();
    render(<Wrapper accountTypes={["Checking"]} />);

    await user.click(screen.getByRole("combobox"));

    expect(
      screen.getByPlaceholderText("Search account types..."),
    ).toBeInTheDocument();
  });
});
