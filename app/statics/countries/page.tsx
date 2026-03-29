import Layout02b from "@/components/layouts/Layout02b";
import CountriesTable from "@/components/statics/CountriesTable";
import { countries } from "@/lib/utils/country";

const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

export default function CountriesPage() {
  return (
    <Layout02b>
      <CountriesTable countries={sortedCountries} />
    </Layout02b>
  );
}
