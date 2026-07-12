import { currency } from "@/lib/utils";

import type { InvestmentDecomposition } from "@/lib/utils/transaction";

interface Props {
  decomposition: InvestmentDecomposition;
  defaultCurrency: string;
  userLocale: string;
}

interface Line {
  label: string;
  hint: string;
  value: number;
  /** Costs and returns are worth colouring; what you paid in is not. */
  signed?: boolean;
}

/**
 * Where an investment's balance came from.
 *
 * The whole point of splitting the account was to be able to answer this without
 * lying: fees leave the cash leg and returns happen on the invested leg, so they
 * physically cannot contaminate each other. Before the split, a fee deducted from
 * your provider's cash was indistinguishable from a bad month.
 *
 * Every row of the ledger lands in exactly one line below, so the lines sum to
 * the balance. If they ever do not, the ledger and the balance have diverged and
 * you should trust neither.
 */
export default function InvestmentBreakdown({
  decomposition,
  defaultCurrency,
  userLocale,
}: Props) {
  const {
    opening,
    netContributions,
    totalReturn,
    totalWithholding,
    totalFees,
    roundingAdj,
    balance,
  } = decomposition;

  const format = (value: number) =>
    currency(userLocale, defaultCurrency).format(value);

  const lines: Line[] = [
    {
      label: "Opening balance",
      hint: "What was already there when your records begin",
      value: opening,
    },
    {
      label: "Net contributions",
      hint: "Paid in since, less anything taken out",
      value: netContributions,
    },
    {
      label: "Market return",
      hint: "What the market made, or lost",
      value: totalReturn,
      signed: true,
    },
    {
      label: "Fees",
      hint: "What the provider charged you",
      value: totalFees,
      signed: true,
    },
    {
      label: "Retenciones",
      hint: "Tax withheld at source",
      value: totalWithholding,
      signed: true,
    },
    {
      label: "Rounding",
      hint: "Cent drift — neither yours nor the market's",
      value: roundingAdj,
      signed: true,
    },
  ];

  // What you put in versus what happened to it. The single number most worth
  // knowing, and the one the old model could not compute.
  const paidIn = opening + netContributions;
  const gain = balance - paidIn;
  const gainPct = paidIn !== 0 ? (gain / paidIn) * 100 : 0;

  return (
    <section className="w-full">
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-medium select-none">
          Where this balance came from
        </h3>

        <dl className="space-y-1.5">
          {lines.map((line) => (
            <div
              key={line.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="min-w-0">
                <span className="text-sm select-none">{line.label}</span>
                <span className="text-muted-foreground ml-2 hidden text-xs select-none sm:inline">
                  {line.hint}
                </span>
              </dt>
              <dd
                className={`font-mono text-sm tabular-nums ${
                  line.signed && line.value < 0
                    ? "text-red-500"
                    : line.signed && line.value > 0
                      ? "text-emerald-500"
                      : ""
                }`}
              >
                {format(line.value)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="text-sm font-medium select-none">Balance</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">
            {format(balance)}
          </dd>
        </div>

        {paidIn !== 0 && (
          <p className="text-muted-foreground mt-3 text-xs select-none">
            You have put in {format(paidIn)}. It is now worth {format(balance)} —{" "}
            <span
              className={gain < 0 ? "text-red-500" : "text-emerald-500"}
            >
              {gain >= 0 ? "+" : ""}
              {format(gain)} ({gain >= 0 ? "+" : ""}
              {gainPct.toFixed(2)}%)
            </span>{" "}
            after fees and retenciones.
          </p>
        )}
      </div>
    </section>
  );
}
