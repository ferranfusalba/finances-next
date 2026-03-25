import Layout02b from "@/components/layouts/Layout02b";
import { PlaygroundToastButtons } from "./PlaygroundToastButtons";
import { currencies, getCurrencySymbol, getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";
import { getCountryFlag } from "@/lib/utils/country";
import CurrencyTag from "@/components/chips/CurrencyTag";
import BorderChip from "@/components/chips/BorderChip";

const PlaygroundServerPage = async () => {
  return (
    <Layout02b>
      {/* Toast Notifications */}
      <div className="m-2 flex flex-wrap gap-2">
        <PlaygroundToastButtons />
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

export default PlaygroundServerPage;
