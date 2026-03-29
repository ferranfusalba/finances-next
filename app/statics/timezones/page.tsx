import Layout02b from "@/components/layouts/Layout02b";
import TimezonesTable from "@/components/statics/TimezonesTable";
import timezones from "@/statics/timezones-iana.json";
import { Timezone } from "@/types/Timezone";

export default function TimezonesPage() {
  return (
    <Layout02b>
      <TimezonesTable timezones={timezones as Timezone[]} />
    </Layout02b>
  );
}
