import { z } from "zod";

const baseFields = {
  concept: z.string(),
  type: z.string().min(1, {
    message: "Transaction Type is required.",
  }),
  currency: z.string().min(3, {
    message: "Currency code is required.",
  }),
  amountForm: z.string().min(1, {
    message: "Amount Type is required.",
  }),
  foreignCurrency: z.string(),
  foreignCurrencyAmount: z.string(),
  foreignCurrencyExchangeRate: z.string(),
  category: z.string(),
  subcategory: z.string(),
  tags: z.array(z.string()),
  date: z.date({ required_error: "A date is required." }),
  time: z.string(),
  timezone: z.string().min(1, {
    message: "Timezone is required",
  }),
  location: z.string(),
  notes: z.string(),
};

const foreignCurrencyRefine = {
  refineFn: (data: { foreignCurrency: string; foreignCurrencyAmount: string }) => {
    if (data.foreignCurrency && !data.foreignCurrencyAmount) {
      return false;
    }
    return true;
  },
  options: {
    message:
      "Foreign Currency Amount is required when Foreign Currency is provided.",
    path: ["foreignCurrencyAmount"] as [string],
  },
};

export function buildAccountTransactionSchema() {
  return z
    .object({
      ...baseFields,
      payee: z.string(),
      typeTransferDestinationAccount: z.string(),
      taxLines: z.array(
        z.object({
          rate: z.string(),
          amount: z.string(),
          inclusive: z.boolean(),
        }),
      ),
    })
    .refine(foreignCurrencyRefine.refineFn, foreignCurrencyRefine.options)
    .refine(
      (data) => {
        if (data.type === "TRANSFER" && !data.typeTransferDestinationAccount) {
          return false;
        }
        return true;
      },
      {
        message:
          "Transfer to Destination Account is required when Transaction Type is TRANSFER.",
        path: ["typeTransferDestinationAccount"],
      },
    );
}

export function buildBudgetTransactionSchema() {
  return z
    .object({
      ...baseFields,
    })
    .refine(foreignCurrencyRefine.refineFn, foreignCurrencyRefine.options);
}

export type AccountTransactionFormValues = z.infer<
  ReturnType<typeof buildAccountTransactionSchema>
>;

export type BudgetTransactionFormValues = z.infer<
  ReturnType<typeof buildBudgetTransactionSchema>
>;
