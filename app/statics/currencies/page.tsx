import Layout02b from "@/components/layouts/Layout02b";
import CurrenciesTable from "@/components/statics/CurrenciesTable";
import { currencies } from "@/lib/utils/currency";

export default function CurrenciesPage() {
  return (
    <Layout02b>
      <CurrenciesTable currencies={currencies} />
    </Layout02b>
  );
}
