import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
  it("renders the select trigger with label", () => {
    render(<Wrapper accountTypes={["Checking", "Savings"]} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Account Type*")).toBeInTheDocument();
  });

  it("renders existing account types as hidden native options", () => {
    render(<Wrapper accountTypes={["Checking", "Savings"]} />);

    const options = screen.getAllByRole("option", { hidden: true });
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("Checking");
    expect(optionTexts).toContain("Savings");
  });

  it("includes 'Add a new type' as a native option", () => {
    render(<Wrapper accountTypes={["Checking"]} />);

    const options = screen.getAllByRole("option", { hidden: true });
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("Add a new type");
  });

  it("renders options sorted alphabetically", () => {
    render(
      <Wrapper accountTypes={["Savings", "Checking", "Investment"]} />,
    );

    const options = screen.getAllByRole("option", { hidden: true });
    // First option is "Add a new type", then sorted types
    expect(options[0]).toHaveTextContent("Add a new type");
    expect(options[1]).toHaveTextContent("Checking");
    expect(options[2]).toHaveTextContent("Investment");
    expect(options[3]).toHaveTextContent("Savings");
  });

  it("shows placeholder when no default type", () => {
    render(<Wrapper accountTypes={["Checking"]} />);

    expect(screen.getByText("Select an account type")).toBeInTheDocument();
  });

  it("shows the default type value when provided", () => {
    render(<Wrapper accountTypes={["Checking"]} defaultType="Checking" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Checking");
  });

  it("renders empty list when no account types exist", () => {
    render(<Wrapper accountTypes={[]} />);

    const options = screen.getAllByRole("option", { hidden: true });
    // Only "Add a new type"
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Add a new type");
  });

  it("renders combobox in closed state initially", () => {
    render(<Wrapper accountTypes={["Checking"]} />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("data-state", "closed");
    expect(combobox).toHaveAttribute("type", "button");
  });
});
