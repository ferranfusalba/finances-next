"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Layout02b from "@/components/layouts/Layout02b";
import { currencies, getCurrencySymbol, getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";
import { getCountryFlag } from "@/lib/utils/country";
import CurrencyTag from "@/components/chips/CurrencyTag";
import BorderChip from "@/components/chips/BorderChip";

const PlaygroundClientPage = () => {
  return (
    <Layout02b>
      {/* Toast Notifications */}
      <div className="m-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast("Default notification", { description: "This is a default toast" })}
        >
          Toast Default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Success notification", { description: "This is a success toast" })}
        >
          Toast Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Error notification", { description: "This is an error toast" })}
        >
          Toast Error
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Warning notification", { description: "This is a warning toast" })}
        >
          Toast Warning
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Info notification", { description: "This is an info toast" })}
        >
          Toast Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.loading("Loading notification", { description: "This is a loading toast" })}
        >
          Toast Loading
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
              loading: "Loading...",
              success: "Promise resolved!",
              error: "Promise rejected!",
            });
          }}
        >
          Toast Promise
        </Button>
      </div>

      {/* Currencies Table */}
      <div className="m-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left select-none">
              <th className="p-2">Code</th>
              <th className="p-2">Symbol</th>
              <th className="p-2">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Countries</th>
              <th className="p-2">Colors</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.code} className="border-b">
                <td className="p-2 font-mono">{currency.code}</td>
                <td className="p-2">{getCurrencySymbol(currency.code)}</td>
                <td className="p-2">{currency.name}</td>
                <td className="p-2 text-muted-foreground">
                  {currency.type ?? "currency"}
                </td>
                <td className="p-2">
                  {currency.countries?.map((code) => (
                    <span key={code} title={code}>
                      {getCountryFlag(code)}
                    </span>
                  ))}
                </td>
                <td className="p-2">
                  {getCurrencyColor0(currency.code) && getCurrencyColor1(currency.code) ? (
                    <div className="flex gap-1">
                      <CurrencyTag code={currency.code} />
                      <BorderChip
                        data={currency.code}
                        borderColor={getCurrencyColor0(currency.code) as string}
                      />
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout02b>
  );
};

export default PlaygroundClientPage;
